-- Development-only DCS mission script for surveying committed deployment candidates.
-- Add trigger zones named DCC_SURVEY_<objective-id>, then run this script at mission start.
-- Copy DCC_SITE_SURVEY lines from dcs.log into reviewed theatre data; raw output is never runtime data.

local GRID_STEP = 100
local SLOT_COUNT = 8
local SLOT_RADIUS = 70
local MAX_SLOPE_DEGREES = 6
local MIN_SCENERY_CLEARANCE = 18
local MAX_ROAD_DISTANCE = 600
local BATCH_SIZE = 20
local BATCH_INTERVAL_SECONDS = 0.05

local function safeNumber(value)
    return value and string.format('%.2f', value) or 'null'
end

local function surfaceName(surface)
    if surface == land.SurfaceType.LAND then return 'LAND' end
    if surface == land.SurfaceType.ROAD then return 'ROAD' end
    if surface == land.SurfaceType.RUNWAY then return 'RUNWAY' end
    if surface == land.SurfaceType.WATER then return 'WATER' end
    if surface == land.SurfaceType.SHALLOW_WATER then return 'SHALLOW_WATER' end
    return tostring(surface)
end

local function slopeDegrees(x, y)
    local distance = 10
    local left = land.getHeight({ x = x - distance, y = y })
    local right = land.getHeight({ x = x + distance, y = y })
    local down = land.getHeight({ x = x, y = y - distance })
    local up = land.getHeight({ x = x, y = y + distance })
    local gradient = math.max(math.abs(right - left), math.abs(up - down)) / (distance * 2)
    return math.deg(math.atan(gradient))
end

local function obstructionCount(x, y, radius)
    local count = 0
    local volume = {
        id = world.VolumeType.SPHERE,
        params = { point = { x = x, y = land.getHeight({ x = x, y = y }), z = y }, radius = radius }
    }
    local function found()
        count = count + 1
        return true
    end
    world.searchObjects(Object.Category.SCENERY, volume, found)
    world.searchObjects(Object.Category.STATIC, volume, found)
    return count
end

local function roadDistance(x, y)
    local roadX, roadY = land.getClosestPointOnRoads('roads', x, y)
    if not roadX or not roadY then return math.huge end
    return math.sqrt((roadX - x) ^ 2 + (roadY - y) ^ 2)
end

local function evaluate(x, y, extractionRadius)
    local reasons = {}
    local surface = land.getSurfaceType({ x = x, y = y })
    local slope = slopeDegrees(x, y)
    local road = roadDistance(x, y)
    if surface ~= land.SurfaceType.LAND and surface ~= land.SurfaceType.ROAD then
        reasons[#reasons + 1] = 'surface:' .. surfaceName(surface)
    end
    if slope > MAX_SLOPE_DEGREES then reasons[#reasons + 1] = 'slope:' .. safeNumber(slope) end
    if road > MAX_ROAD_DISTANCE then reasons[#reasons + 1] = 'road:' .. safeNumber(road) end

    local slots = {}
    for index = 1, SLOT_COUNT do
        local angle = math.pi * 2 * (index - 1) / SLOT_COUNT
        local slotX = x + math.cos(angle) * SLOT_RADIUS
        local slotY = y + math.sin(angle) * SLOT_RADIUS
        local slotSurface = land.getSurfaceType({ x = slotX, y = slotY })
        if slotSurface ~= land.SurfaceType.LAND and slotSurface ~= land.SurfaceType.ROAD then
            reasons[#reasons + 1] = 'slot-' .. index .. '-surface:' .. surfaceName(slotSurface)
        end
        local clearance = obstructionCount(slotX, slotY, MIN_SCENERY_CLEARANCE)
        local slotSlope = slopeDegrees(slotX, slotY)
        if clearance > 0 then reasons[#reasons + 1] = 'slot-' .. index .. '-obstruction:' .. clearance end
        if slotSlope > MAX_SLOPE_DEGREES then
            reasons[#reasons + 1] = 'slot-' .. index .. '-slope:' .. safeNumber(slotSlope)
        end
        slots[#slots + 1] = { x = slotX, y = slotY, heading = angle }
    end

    if extractionRadius then
        for sample = 1, 12 do
            local angle = math.pi * 2 * (sample - 1) / 12
            local sampleX = x + math.cos(angle) * extractionRadius
            local sampleY = y + math.sin(angle) * extractionRadius
            local sampleSurface = land.getSurfaceType({ x = sampleX, y = sampleY })
            if sampleSurface ~= land.SurfaceType.LAND and sampleSurface ~= land.SurfaceType.ROAD then
                reasons[#reasons + 1] = 'extraction-zone-surface:' .. surfaceName(sampleSurface)
                break
            end
            if slopeDegrees(sampleX, sampleY) > MAX_SLOPE_DEGREES then
                reasons[#reasons + 1] = 'extraction-zone-slope'
                break
            end
        end
    end
    return reasons, slots, slope, road, surface
end

local function emit(zoneName, x, y, reasons, slots, slope, road, surface)
    local status = #reasons == 0 and 'candidate' or 'rejected'
    env.info(string.format(
        'DCC_SITE_SURVEY zone=%s status=%s x=%.2f y=%.2f surface=%s slope=%.2f road=%.2f capacity=%d reasons=%s',
        zoneName,
        status,
        x,
        y,
        surfaceName(surface),
        slope,
        road,
        #slots,
        table.concat(reasons, '|')
    ))
    if status == 'candidate' then
        for index, slot in ipairs(slots) do
            env.info(string.format(
                'DCC_SITE_SLOT zone=%s index=%d x=%.2f y=%.2f heading=%.4f',
                zoneName,
                index,
                slot.x,
                slot.y,
                slot.heading
            ))
        end
    end
end

local surveyZones = {}
for _, zone in pairs(env.mission.triggers.zones or {}) do
    if zone.name and string.sub(zone.name, 1, 11) == 'DCC_SURVEY_' then
        surveyZones[#surveyZones + 1] = zone
    end
end
table.sort(surveyZones, function(left, right) return left.name < right.name end)

local samples = {}
for _, zone in ipairs(surveyZones) do
    local radius = zone.radius or 1000
    for offsetX = -radius, radius, GRID_STEP do
        for offsetY = -radius, radius, GRID_STEP do
            if offsetX * offsetX + offsetY * offsetY <= radius * radius then
                samples[#samples + 1] = {
                    zoneName = zone.name,
                    x = zone.x + offsetX,
                    y = zone.y + offsetY
                }
            end
        end
    end
end

local cursor = 1
local nextProgress = 10

local function processBatch(_, now)
    local last = math.min(cursor + BATCH_SIZE - 1, #samples)
    for index = cursor, last do
        local sample = samples[index]
        local reasons, slots, slope, road, surface = evaluate(sample.x, sample.y, 150)
        emit(sample.zoneName, sample.x, sample.y, reasons, slots, slope, road, surface)
    end
    cursor = last + 1

    local progress = #samples == 0 and 100 or math.floor((last / #samples) * 100)
    if progress >= nextProgress and cursor <= #samples then
        trigger.action.outText(string.format('DCC terrain survey: %d%%', progress), 3)
        env.info(string.format('DCC_SITE_SURVEY_PROGRESS processed=%d total=%d', last, #samples))
        nextProgress = nextProgress + 10
    end

    if cursor <= #samples then return now + BATCH_INTERVAL_SECONDS end

    env.info(string.format(
        'DCC_SITE_SURVEY_COMPLETE zones=%d samples=%d',
        #surveyZones,
        #samples
    ))
    trigger.action.outText('DCC South Atlantic site survey complete; inspect dcs.log.', 20)
    return nil
end

env.info(string.format('DCC_SITE_SURVEY_START zones=%d samples=%d', #surveyZones, #samples))
trigger.action.outText(string.format(
    'DCC South Atlantic survey started: %d objectives',
    #surveyZones
), 5)
timer.scheduleFunction(processBatch, nil, timer.getTime() + 0.1)
