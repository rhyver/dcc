local logName = 'DCC.STATE'
local function debugLog(message) log.write(logName, log.INFO, tostring(message)) end

local missionState = {
    missionId = config.missionId,
    missionEnded = false,
    ejectedPilots = {},
    lostUnits = {},
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
        local groupName = list[i]
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
                            hasAliveUnits = true
                            local position = unit:getPoint()
                            local unitInfo = {
                                name = unit:getName(),
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
                            name = groupName,
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
        local groupName = list[i]
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
                            hasAliveUnits = true
                            local position = unit:getPoint()
                            local unitInfo = {
                                name = unit:getName(),
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
                            name = groupName,
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
            fp:write(json:encode(missionState))
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

local ev = {}
function ev:onEvent(event)
    debugLog('onEvent: '..event.id)
    
    -- UNIT LOST
    if event.id == world.event.S_EVENT_UNIT_LOST then
        debugLog('S_EVENT_UNIT_LOST')
        local initiator = event.initiator
        
        if not initiator then return end
        if not initiator:isExist() then return end
        if not initiator.getName then return end
        if not initiator.getPosition then return end

        debugLog("valid S_EVENT_UNIT_LOST")
        debugLog("initiator: "..initiator:getName())

        local name = initiator:getName()
        local position = initiator:getPosition().p
        local group = initiator:getGroup()
        local groupName = group and group:getName() or nil
        local category = group and group:getCategory() or nil

        missionState.lostUnits[#missionState.lostUnits + 1] = {
            name = name,
            groupName = groupName,
            type = initiator:getTypeName(),
            category = category,
            x = position.x,
            y = position.z
        }
    end

    -- EJECTION
    if event.id == world.event.S_EVENT_LANDING_AFTER_EJECTION then
        debugLog('S_EVENT_LANDING_AFTER_EJECTION')
        local initiator = event.initiator
        
        if not initiator then return end
        if not initiator:isExist() then return end
        if not initiator.getName then return end
        if not initiator.getPosition then return end

        local name = initiator:getName()
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
    if event.id == world.event.S_EVENT_BIRTH and event.initiator and event.initiator.getPlayerName then
        local player = event.initiator:getPlayerName()
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
