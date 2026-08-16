-- Development-only DCS mission script for extracting South Atlantic airbase metadata.
-- It matches the four campaign airports by position and writes IDs, runways, and parking to dcs.log.

local targets = {
    { name = 'Stanley Airport', x = 89048, y = 93885 },
    { name = 'Rio Grande', x = -197152, y = -559454 },
    { name = 'Rio Gallegos', x = 25709, y = -703430 },
    { name = 'San Julian', x = 297467, y = -636907 }
}

local function number(value)
    return value and string.format('%.3f', value) or 'null'
end

local function quoted(value)
    return string.format('%q', tostring(value or ''))
end

local function position(value)
    if not value then return nil, nil end
    return value.x, value.z or value.y
end

local function distanceSquared(leftX, leftY, rightX, rightY)
    return (leftX - rightX) ^ 2 + (leftY - rightY) ^ 2
end

local airbases = world.getAirbases() or {}
table.sort(airbases, function(left, right) return left:getID() < right:getID() end)

for _, target in ipairs(targets) do
    local nearest = nil
    local nearestDistance = math.huge
    for _, airbase in ipairs(airbases) do
        local point = airbase:getPoint()
        local x, y = position(point)
        if x and y then
            local candidateDistance = distanceSquared(target.x, target.y, x, y)
            if candidateDistance < nearestDistance then
                nearest = airbase
                nearestDistance = candidateDistance
            end
        end
    end

    if not nearest or nearestDistance > 25000 ^ 2 then
        env.error(string.format('DCC_AIRBASE_MISSING target=%s', quoted(target.name)))
    else
        local point = nearest:getPoint()
        local x, y = position(point)
        local category = nearest:getCategory()
        env.info(string.format(
            'DCC_AIRBASE target=%s dcsName=%s id=%d category=%s x=%s y=%s distance=%s',
            quoted(target.name),
            quoted(nearest:getName()),
            nearest:getID(),
            tostring(category),
            number(x),
            number(y),
            number(math.sqrt(nearestDistance))
        ))

        local runwayOk, runways = pcall(function() return nearest:getRunways() end)
        if runwayOk and runways then
            for index, runway in ipairs(runways) do
                local runwayX, runwayY = position(runway.position or runway.point)
                env.info(string.format(
                    'DCC_AIRBASE_RUNWAY target=%s index=%d name=%s course=%s heading=%s x=%s y=%s length=%s width=%s',
                    quoted(target.name),
                    index,
                    quoted(runway.Name or runway.name or index),
                    number(runway.course),
                    number(runway.heading),
                    number(runwayX),
                    number(runwayY),
                    number(runway.length),
                    number(runway.width)
                ))
            end
        else
            env.warning(string.format('DCC_AIRBASE_RUNWAY_UNAVAILABLE target=%s', quoted(target.name)))
        end

        local parkingOk, parking = pcall(function() return nearest:getParking(false) end)
        if parkingOk and parking then
            table.sort(parking, function(left, right)
                return (left.Term_Index or 0) < (right.Term_Index or 0)
            end)
            for index, stand in ipairs(parking) do
                local standX, standY = position(stand.vTerminalPos or stand.position)
                env.info(string.format(
                    'DCC_AIRBASE_STAND target=%s index=%d terminalId=%s termIndex=%s termType=%s toAC=%s x=%s y=%s distanceToRunway=%s',
                    quoted(target.name),
                    index,
                    tostring(stand.TerminalID or stand.TerminalId or 'null'),
                    tostring(stand.Term_Index or 'null'),
                    tostring(stand.Term_Type or 'null'),
                    tostring(stand.TO_AC or 'null'),
                    number(standX),
                    number(standY),
                    number(stand.fDistToRW)
                ))
            end
            env.info(string.format(
                'DCC_AIRBASE_STANDS_COMPLETE target=%s count=%d',
                quoted(target.name),
                #parking
            ))
        else
            env.error(string.format('DCC_AIRBASE_PARKING_UNAVAILABLE target=%s', quoted(target.name)))
        end
    end
end

env.info(string.format('DCC_AIRBASE_SURVEY_COMPLETE targets=%d', #targets))
trigger.action.outText('DCC South Atlantic airfield survey complete; inspect dcs.log.', 20)
