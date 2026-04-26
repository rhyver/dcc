local logName = 'DCC.STATE'
local function debugLog(message) log.write(logName, log.INFO, tostring(message)) end

local function isArray(value)
    if type(value) ~= 'table' then
        return false
    end

    local maxIndex = 0
    for key, _ in pairs(value) do
        if type(key) ~= 'number' or key < 1 or key % 1 ~= 0 then
            return false
        end
        if key > maxIndex then
            maxIndex = key
        end
    end

    for index = 1, maxIndex do
        if value[index] == nil then
            return false
        end
    end

    return true
end

local function encodeJsonString(value)
    return '"' .. value
        :gsub('\\', '\\\\')
        :gsub('"', '\\"')
        :gsub('\b', '\\b')
        :gsub('\f', '\\f')
        :gsub('\n', '\\n')
        :gsub('\r', '\\r')
        :gsub('\t', '\\t')
        .. '"'
end

local function encodeJsonValue(value)
    local valueType = type(value)

    if valueType == 'nil' then
        return 'null'
    end

    if valueType == 'boolean' or valueType == 'number' then
        return tostring(value)
    end

    if valueType == 'string' then
        return encodeJsonString(value)
    end

    if valueType == 'table' then
        local parts = {}

        if isArray(value) then
            for index = 1, #value do
                parts[#parts + 1] = encodeJsonValue(value[index])
            end
            return '[' .. table.concat(parts, ',') .. ']'
        end

        for key, nestedValue in pairs(value) do
            parts[#parts + 1] = encodeJsonString(tostring(key)) .. ':' .. encodeJsonValue(nestedValue)
        end
        return '{' .. table.concat(parts, ',') .. '}'
    end

    return 'null'
end

local function encodeMissionState(value)
    if json and json.encode then
        return json:encode(value)
    end

    return encodeJsonValue(value)
end

local missionState = {
    missionId = config.missionId,
    missionEnded = false,
    ejectedPilots = {},
    lostUnits = {},
    cargoDeliveries = {},
    groupPositions = {
        blue = {
            aircraft = {},
            ground = {}
        },
        red = {
            aircraft = {},
            ground = {}
        }
    },
}

local transportGroups = {}
local unitCache = {}
local lostUnitIndexesByName = {}
local getInitiatorGroup

local function safeCall(callback, fallback)
    local ok, result = pcall(callback)
    if ok then
        return result
    end
    return fallback
end

local function stringifyName(name)
    if name == nil then
        return nil
    end

    return tostring(name)
end

local function cacheUnitData(unitData, groupData, categoryName, coalitionName)
    if not unitData or not unitData.name then
        return
    end

    local name = stringifyName(unitData.name)
    local groupName = stringifyName(groupData and groupData.name or nil)
    local cachedUnit = {
        name = name,
        groupName = groupName,
        type = unitData.type or "unknown",
        categoryName = categoryName,
        coalition = coalitionName,
        x = unitData.x or 0,
        y = unitData.y or 0
    }
    unitCache[name] = cachedUnit

    local unitId = stringifyName(unitData.unitId or unitData.unit_id or nil)
    if unitId then
        unitCache[unitId] = cachedUnit
    end
end

local function loadMissionUnitCache()
    if not env or not env.mission or not env.mission.coalition then
        return
    end

    for coalitionName, coalitionData in pairs(env.mission.coalition) do
        if coalitionData and coalitionData.country then
            for _, countryData in pairs(coalitionData.country) do
                for _, categoryName in pairs({'plane', 'helicopter', 'vehicle', 'ship', 'static'}) do
                    local groups = countryData and countryData[categoryName] and countryData[categoryName].group
                    if groups then
                        for _, groupData in pairs(groups) do
                            if groupData and groupData.units then
                                for _, unitData in pairs(groupData.units) do
                                    cacheUnitData(unitData, groupData, categoryName, coalitionName)
                                end
                            end
                        end
                    end
                end
            end
        end
    end
end

local function cacheLiveUnit(unit, group, category)
    if not unit or not unit.getName then
        return
    end

    local name = stringifyName(safeCall(function() return unit:getName() end, nil))
    if not name then
        return
    end

    local point = safeCall(function() return unit:getPoint() end, nil)
    local groupName = stringifyName(group and safeCall(function() return group:getName() end, nil) or nil)
    local coalitionId = group and safeCall(function() return group:getCoalition() end, nil) or nil
    local coalitionName = coalitionId == coalition.side.BLUE and "blue" or coalitionId == coalition.side.RED and "red" or nil
    local cached = unitCache[name] or {}

    unitCache[name] = {
        name = name,
        groupName = groupName,
        type = safeCall(function() return unit:getTypeName() end, "unknown"),
        category = category,
        coalition = coalitionName or cached.coalition,
        x = point and point.x or cached.x or 0,
        y = point and point.z or cached.y or 0
    }
end

local function mergeLostUnitAttribution(lostUnit, attribution)
    if not lostUnit or not attribution then
        return
    end

    lostUnit.lossType = attribution.lossType or lostUnit.lossType
    lostUnit.killerPlayerName = attribution.killerPlayerName or lostUnit.killerPlayerName
    lostUnit.killerUnitName = attribution.killerUnitName or lostUnit.killerUnitName
    lostUnit.killerGroupName = attribution.killerGroupName or lostUnit.killerGroupName
    lostUnit.weaponName = attribution.weaponName or lostUnit.weaponName
    lostUnit.killCause = attribution.killCause or lostUnit.killCause
end

local function addOrUpdateLostUnit(lostUnit, attribution)
    if not lostUnit or not lostUnit.name then
        return
    end

    local existingIndex = lostUnitIndexesByName[lostUnit.name]
    if existingIndex then
        mergeLostUnitAttribution(missionState.lostUnits[existingIndex], attribution)
        return
    end

    mergeLostUnitAttribution(lostUnit, attribution)
    missionState.lostUnits[#missionState.lostUnits + 1] = lostUnit
    lostUnitIndexesByName[lostUnit.name] = #missionState.lostUnits
end

local function recordLostUnit(unit, eventName, attribution)
    if not unit or not unit.getName then
        return
    end

    local name = stringifyName(safeCall(function() return unit:getName() end, nil))
    if not name then
        return
    end

    local cached = unitCache[name] or {}
    name = cached.name or name
    local position = safeCall(function() return unit:getPosition().p end, nil)
    if not position then
        local point = safeCall(function() return unit:getPoint() end, nil)
        if point then
            position = { x = point.x, z = point.z }
        end
    end

    local group = getInitiatorGroup(unit)
    local groupName = stringifyName(group and safeCall(function() return group:getName() end, nil) or cached.groupName)
    local category = group and safeCall(function() return group:getCategory() end, nil) or cached.category

    addOrUpdateLostUnit({
        name = name,
        groupName = groupName,
        type = safeCall(function() return unit:getTypeName() end, cached.type or "unknown"),
        category = category,
        categoryName = cached.categoryName,
        coalition = cached.coalition,
        event = eventName,
        x = position and position.x or cached.x or 0,
        y = position and position.z or cached.y or 0
    }, attribution)
    debugLog("Lost unit recorded: "..name.." ("..(eventName or "unknown")..")")
end

local function recordUnitKill(data)
    if not data or not data.targetName then
        return
    end

    local targetName = stringifyName(data.targetName)
    local cached = unitCache[targetName] or {}
    addOrUpdateLostUnit({
        name = targetName,
        groupName = stringifyName(data.targetGroupName or cached.groupName),
        type = data.targetType or cached.type or "unknown",
        category = data.targetCategory or cached.category,
        categoryName = cached.categoryName,
        coalition = data.targetCoalition or cached.coalition,
        event = data.event or "external_kill",
        x = data.x or cached.x or 0,
        y = data.y or cached.y or 0
    }, {
        killerPlayerName = data.killerPlayerName,
        killerUnitName = data.killerUnitName,
        killerGroupName = data.killerGroupName,
        weaponName = data.weaponName,
        killCause = data.killCause,
        lossType = data.lossType
    })
    debugLog("Attributed unit kill recorded: "..data.targetName.." ("..(data.killCause or "unknown")..")")
end

local function loadTransportGroups()
    if not env or not env.mission or not env.mission.coalition then
        return
    end

    for _, coalitionData in pairs(env.mission.coalition) do
        if coalitionData and coalitionData.country then
            for _, countryData in pairs(coalitionData.country) do
                local planes = countryData and countryData.plane and countryData.plane.group
                local helicopters = countryData and countryData.helicopter and countryData.helicopter.group

                if planes then
                    for _, groupData in pairs(planes) do
                        if groupData and groupData.name and groupData.task == 'Transport' then
                            transportGroups[groupData.name] = true
                        end
                    end
                end

                if helicopters then
                    for _, groupData in pairs(helicopters) do
                        if groupData and groupData.name and groupData.task == 'Transport' then
                            transportGroups[groupData.name] = true
                        end
                    end
                end
            end
        end
    end
end

local function recordCargoDelivery(groupName, position, deliveryType)
    if not groupName or not position then
        return
    end

    groupName = stringifyName(groupName)
    missionState.cargoDeliveries[groupName] = {
        time = timer.getTime(),
        x = position.x,
        y = position.z,
        deliveryType = deliveryType or 'unknown'
    }
    debugLog('Cargo delivery recorded: '..groupName..' ('..(deliveryType or 'unknown')..')')
end

DCC = DCC or {}
DCC.recordCargoDelivery = recordCargoDelivery
DCC.recordUnitKill = recordUnitKill

local function messageAll(message, displayTime)
    local msg = {}
    msg.text = message
    if displayTime then
        msg.displayTime = displayTime
    else
        msg.displayTime = 25
    end
    msg.msgFor = {coa = {'all'}}
    mist.message.add(msg)
end

local function canWrite(name)
    local f = io.open(name, "w")
    if f then
        f:close()
        return true
    end
    return false
end

local function findFilePath()
    if lfs then
        local path = lfs.writedir().."Missions\\"
        local filePath = string.format("%sdcc_state.json", path)

        local isOk = canWrite(filePath)
        if isOk then 
            debugLog(string.format("The dcc_state.json file will be created in %s : (%s)", path, filePath))
            return filePath
        end
    end

    return nil
end

local filePath = findFilePath()
loadMissionUnitCache()
loadTransportGroups()

if filePath then
    debugLog(string.format("State File Location: %s", filePath))
else
    debugLog('Insufficient libraries to run state.lua, you must disable the sanitization of the io and lfs libraries in ./Scripts/MissionScripting.lua')
    messageAll('No Permission to save the Mission State! Mission Progress will not be saved! Please visit our github or discord to fix the Problem.', 600)
end

-- Get positions and unit info for aircraft groups (AIRPLANE and HELICOPTER)
local function getAircraftGroupPositions(coalition)
    local list = mist.getGroupsByAttribute({coalition = coalition}, 0)
    local groups = {}

    for i in pairs(list) do
        local groupName = stringifyName(list[i])
        if groupName ~= nil then
            local group = Group.getByName(groupName)
            
            if group and group.getCategory then
                local category = group:getCategory()

                if category == Group.Category.AIRPLANE or category == Group.Category.HELICOPTER then
                    local units = group:getUnits()
                    local unitData = {}
                    local hasAliveUnits = false

                    for _, unit in pairs(units) do
                        if unit and unit:isExist() and unit:getLife() > 0 then
                            cacheLiveUnit(unit, group, category)
                            hasAliveUnits = true
                            local position = unit:getPoint()
                            local unitInfo = {
                                name = stringifyName(unit:getName()),
                                type = unit:getTypeName(),
                                x = position.x,
                                y = position.z,
                                altitude = position.y,
                                life = unit:getLife(),
                                inAir = unit:inAir()
                            }
                            unitData[#unitData + 1] = unitInfo
                        end
                    end

                    if hasAliveUnits then
                        local position = mist.getLeadPos(groupName)
                        local groupOut = {
                            name = stringifyName(groupName),
                            x = position and position.x or 0,
                            y = position and position.z or 0,
                            units = unitData
                        }
                        groups[#groups + 1] = groupOut
                    end
                end
            end
        end
    end

    return groups
end

-- Get positions and unit info for ground groups (GROUND and SHIP)
local function getGroundGroupPositions(coalition)
    local list = mist.getGroupsByAttribute({coalition = coalition}, 0)
    local groups = {}

    for i in pairs(list) do
        local groupName = stringifyName(list[i])
        if groupName ~= nil then
            local group = Group.getByName(groupName)
            
            if group and group.getCategory then
                local category = group:getCategory()

                if category == Group.Category.GROUND or category == Group.Category.SHIP then
                    local units = group:getUnits()
                    local unitData = {}
                    local hasAliveUnits = false

                    for _, unit in pairs(units) do
                        if unit and unit:isExist() and unit:getLife() > 0 then
                            cacheLiveUnit(unit, group, category)
                            hasAliveUnits = true
                            local position = unit:getPoint()
                            local unitInfo = {
                                name = stringifyName(unit:getName()),
                                type = unit:getTypeName(),
                                x = position.x,
                                y = position.z,
                                heading = mist.getHeading(unit, true),
                                life = unit:getLife()
                            }
                            unitData[#unitData + 1] = unitInfo
                        end
                    end

                    if hasAliveUnits then
                        local position = mist.getLeadPos(groupName)
                        local groupOut = {
                            name = stringifyName(groupName),
                            x = position and position.x or 0,
                            y = position and position.z or 0,
                            units = unitData
                        }
                        groups[#groups + 1] = groupOut
                    end
                end
            end
        end
    end

    return groups
end

local function export()
    if io and filePath then
        local fp = io.open(filePath, 'w')
        if fp then
            fp:write(encodeMissionState(missionState))
            fp:close()
            debugLog('State exported successfully')
        end
    end
end

local function writeState()
    -- Collect aircraft group positions
    missionState.groupPositions.blue.aircraft = getAircraftGroupPositions("blue")
    missionState.groupPositions.red.aircraft = getAircraftGroupPositions("red")
    
    -- Collect ground group positions
    missionState.groupPositions.blue.ground = getGroundGroupPositions("blue")
    missionState.groupPositions.red.ground = getGroundGroupPositions("red")
    
    missionState.time = timer.getAbsTime()
    export()
end

getInitiatorGroup = function(initiator)
    if not initiator or not initiator.getGroup then return nil end
    return safeCall(function() return initiator:getGroup() end, nil)
end

local ev = {}
function ev:onEvent(event)
    debugLog('onEvent: '..event.id)
    
    -- UNIT DESTRUCTION
    if event.id == world.event.S_EVENT_UNIT_LOST then
        debugLog('S_EVENT_UNIT_LOST')
        recordLostUnit(event.initiator, 'unit_lost', {
            lossType = 'lost'
        })
    end

    if event.id == world.event.S_EVENT_DEAD then
        debugLog('S_EVENT_DEAD')
        recordLostUnit(event.initiator, 'dead', {
            lossType = 'destroyed'
        })
    end

    if event.id == world.event.S_EVENT_KILL then
        debugLog('S_EVENT_KILL')
        local killer = event.initiator
        local killerGroup = getInitiatorGroup(killer)
        recordLostUnit(event.target, 'kill', {
            killerPlayerName = killer and killer.getPlayerName and safeCall(function() return killer:getPlayerName() end, nil) or nil,
            killerUnitName = killer and killer.getName and safeCall(function() return killer:getName() end, nil) or nil,
            killerGroupName = killerGroup and safeCall(function() return killerGroup:getName() end, nil) or nil,
            weaponName = event.weapon and event.weapon.getTypeName and safeCall(function() return event.weapon:getTypeName() end, nil) or nil,
            killCause = 'direct',
            lossType = 'killed'
        })
    end

    if event.id == world.event.S_EVENT_CRASH then
        debugLog('S_EVENT_CRASH')
        recordLostUnit(event.initiator, 'crash', {
            lossType = 'crashed'
        })
    end

    if event.id == world.event.S_EVENT_EJECTION then
        debugLog('S_EVENT_EJECTION')
        recordLostUnit(event.initiator, 'ejection', {
            lossType = 'ejected'
        })
    end

    if event.id == world.event.S_EVENT_PILOT_DEAD then
        debugLog('S_EVENT_PILOT_DEAD')
        recordLostUnit(event.initiator, 'pilot_dead', {
            lossType = 'pilot_dead'
        })
    end

    -- LANDING (for cargo deliveries)
    if event.id == world.event.S_EVENT_LAND then
        debugLog('S_EVENT_LAND')
        local initiator = event.initiator

        if not initiator then return end
        if not initiator:isExist() then return end

        local group = getInitiatorGroup(initiator)
        if not group then return end

        local groupName = stringifyName(group:getName())

        if groupName and transportGroups[groupName] then
            local position = initiator:getPosition().p
            recordCargoDelivery(groupName, position, 'landing')
        end
    end

    -- EJECTION
    if event.id == world.event.S_EVENT_LANDING_AFTER_EJECTION then
        debugLog('S_EVENT_LANDING_AFTER_EJECTION')
        local initiator = event.initiator
        
        if not initiator then return end
        if not initiator:isExist() then return end
        if not initiator.getName then return end
        if not initiator.getPosition then return end

        local name = stringifyName(initiator:getName())
        local position = initiator:getPosition().p    
        
        if position.x ~= 0 and position.y ~= 0 then
            local srfType = land.getSurfaceType(position)
            if srfType ~= land.SurfaceType.WATER and srfType ~= land.SurfaceType.SHALLOW_WATER then
                missionState.ejectedPilots[#missionState.ejectedPilots + 1] = {
                    name = name,
                    x = position.x,
                    y = position.z
                }
            end
        end
    end

    -- PLAYER BIRTH (for logging)
    if event.id == world.event.S_EVENT_BIRTH and event.initiator then
        local group = getInitiatorGroup(event.initiator)
        local category = group and safeCall(function() return group:getCategory() end, nil) or nil
        cacheLiveUnit(event.initiator, group, category)

        local player = event.initiator.getPlayerName and event.initiator:getPlayerName() or nil
        if player then
            debugLog('Player birth: '..player)
        end
    end

    -- MISSION END - Write final state
    if event.id == world.event.S_EVENT_MISSION_END then
        debugLog('S_EVENT_MISSION_END - Saving final state')
        missionState.missionEnded = true
        writeState()
    end
end

world.addEventHandler(ev)

debugLog('DCC State tracking initialized')
