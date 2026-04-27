local logName = 'DCC.CAS'

local function debugLog(message)
    env.info(logName .. ': ' .. tostring(message))
end

DCC_CAS = DCC_CAS or {}
DCC_CAS.groups = DCC_CAS.groups or {}
DCC_CAS.targets = DCC_CAS.targets or {}

local smokeColor = 4
local targetUnitMenuName = "%s: %s"
local startLasingMenuName = "Start Lasing Target"
local stopLasingMenuName = "Stop Laser"

local function sendMessageToUnits(text, unitNames, duration)
    if mist and mist.message then
        mist.message.add({
            text = text,
            displayTime = duration or 5,
            msgFor = { units = unitNames }
        })
        return
    end

    trigger.action.outText(text, duration or 5)
end

local function getFlightGroupUnitNames(groupName)
    local unitNames = {}
    local group = Group.getByName(groupName)

    if not group then
        debugLog("Flight group not found: " .. tostring(groupName))
        return unitNames
    end

    for _, unit in ipairs(group:getUnits()) do
        if unit and unit:isExist() then
            unitNames[#unitNames + 1] = unit:getName()
        end
    end

    return unitNames
end

local function destroyLaser(groupConfig)
    if groupConfig and groupConfig.laser then
        groupConfig.laser:destroy()
        groupConfig.laser = nil
    end
end

local function getTargetUnits(groupName, targetGroupName)
    local units = {}
    local targetGroup = Group.getByName(targetGroupName)

    if targetGroup then
        for _, unit in ipairs(targetGroup:getUnits()) do
            if unit and unit:isExist() and unit:getLife() >= 1 then
                units[#units + 1] = unit
                DCC_CAS.targets[unit:getName()] = groupName
            end
        end
    end

    local targetAAGroup = Group.getByName(targetGroupName .. "|AA")
    if targetAAGroup then
        for _, unit in ipairs(targetAAGroup:getUnits()) do
            if unit and unit:isExist() and unit:getLife() >= 1 then
                units[#units + 1] = unit
                DCC_CAS.targets[unit:getName()] = groupName
            end
        end
    end

    return units
end

function DCC_CAS.Register(groupId, groupName, jtacName, targetGroupName, laserCode)
    if not groupId or not groupName or not jtacName or not targetGroupName then
        debugLog("Skipping incomplete CAS config")
        return
    end

    DCC_CAS.groups[groupName] = {
        groupId = groupId,
        groupName = groupName,
        jtacName = jtacName,
        targetGroupName = targetGroupName,
        laserCode = laserCode or 1688
    }
end

function DCC_CAS.CreateMenu(groupName)
    local groupConfig = DCC_CAS.groups[groupName]
    if not groupConfig then
        debugLog("CAS config not found for " .. tostring(groupName))
        return
    end

    local flightGroup = Group.getByName(groupConfig.groupName)
    if flightGroup and flightGroup.getID then
        groupConfig.groupId = flightGroup:getID()
    end

    missionCommands.removeItemForGroup(groupConfig.groupId, "CAS")

    local flightGroupUnitNames = getFlightGroupUnitNames(groupConfig.groupName)
    local targetUnits = getTargetUnits(groupName, groupConfig.targetGroupName)

    missionCommands.addSubMenuForGroup(groupConfig.groupId, "CAS")

    if #targetUnits == 0 then
        missionCommands.addCommandForGroup(groupConfig.groupId, "All targets are destroyed", { "CAS" }, function() end)
        return
    end

    for index, unit in ipairs(targetUnits) do
        local unitPath = missionCommands.addSubMenuForGroup(
            groupConfig.groupId,
            string.format(targetUnitMenuName, index, unit:getTypeName()),
            { "CAS" }
        )

        missionCommands.addCommandForGroup(groupConfig.groupId, "Request Smoke", unitPath, DCC_CAS.SmokeUnit, unit, flightGroupUnitNames)
        missionCommands.addCommandForGroup(groupConfig.groupId, "Get LL Coordinates", unitPath, DCC_CAS.GetUnitLL, unit, flightGroupUnitNames, false)
        missionCommands.addCommandForGroup(groupConfig.groupId, "Get LL DMS Coordinates", unitPath, DCC_CAS.GetUnitLL, unit, flightGroupUnitNames, true)
        if groupConfig.laser then
            missionCommands.addCommandForGroup(groupConfig.groupId, stopLasingMenuName, unitPath, DCC_CAS.StopLaser, groupName, unit, flightGroupUnitNames)
        else
            missionCommands.addCommandForGroup(groupConfig.groupId, startLasingMenuName, unitPath, DCC_CAS.LaseTarget, groupName, unit, flightGroupUnitNames)
        end
    end
end

function DCC_CAS.SmokeUnit(unit, flightGroupUnitNames)
    if not unit or not unit:isExist() then return end

    sendMessageToUnits("Copy. Marking " .. unit:getTypeName() .. " with smoke.", flightGroupUnitNames)
    trigger.action.smoke(unit:getPoint(), smokeColor)
end

function DCC_CAS.GetUnitLL(unit, flightGroupUnitNames, dms)
    if not unit or not unit:isExist() then return end

    local unitTable = { unit:getName() }
    local positionText = mist.getLLString({ units = unitTable, acc = 3, DMS = dms })
    sendMessageToUnits(positionText, flightGroupUnitNames, 30)

    local point = unit:getPoint()
    local altitudeMeters = land.getHeight({ x = point.x, y = point.z })
    local altitudeFeet = math.floor(altitudeMeters * 3.28084)
    sendMessageToUnits("Altitude: " .. tostring(altitudeFeet) .. " ft", flightGroupUnitNames, 30)
end

function DCC_CAS.LaseTarget(groupName, targetUnit, flightGroupUnitNames)
    local groupConfig = DCC_CAS.groups[groupName]
    if not groupConfig or not targetUnit or not targetUnit:isExist() then return end

    local jtac = Unit.getByName(groupConfig.jtacName)
    if not jtac or not jtac:isExist() then
        debugLog("JTAC not found: " .. tostring(groupConfig.jtacName))
        return
    end

    destroyLaser(groupConfig)

    local target = targetUnit:getPoint()
    groupConfig.laser = Spot.createLaser(jtac, nil, target, groupConfig.laserCode)

    sendMessageToUnits(
        string.format("Copy. Lasing %s with code %s.", targetUnit:getTypeName(), tostring(groupConfig.laserCode)),
        flightGroupUnitNames,
        10
    )

    DCC_CAS.CreateMenu(groupName)
end

function DCC_CAS.StopLaser(groupName, _, flightGroupUnitNames)
    local groupConfig = DCC_CAS.groups[groupName]
    if not groupConfig then return end

    destroyLaser(groupConfig)
    sendMessageToUnits("Laser stopped.", flightGroupUnitNames)
    DCC_CAS.CreateMenu(groupName)
end

function DCC_CAS.OnTargetDead(groupName, unitName)
    local groupConfig = DCC_CAS.groups[groupName]
    if not groupConfig then return end

    destroyLaser(groupConfig)
    sendMessageToUnits("Target " .. tostring(unitName) .. " destroyed.", getFlightGroupUnitNames(groupName))
    DCC_CAS.CreateMenu(groupName)
end

function DCC_CAS:onEvent(event)
    if event.id == world.event.S_EVENT_BIRTH and event.initiator then
        local unit = event.initiator
        local group = unit:getGroup()
        if group and DCC_CAS.groups[group:getName()] then
            DCC_CAS.groups[group:getName()].groupId = group:getID()
            DCC_CAS.CreateMenu(group:getName())
        end
    elseif event.id == world.event.S_EVENT_DEAD and event.initiator then
        local unitName = event.initiator:getName()
        local groupName = DCC_CAS.targets[unitName]
        if groupName then
            DCC_CAS.OnTargetDead(groupName, unitName)
        end
    end
end

function DCC_CAS.Start()
    world.addEventHandler(DCC_CAS)

    for groupName in pairs(DCC_CAS.groups) do
        DCC_CAS.CreateMenu(groupName)
    end
end

if config and config.flightGroups then
    for _, flightGroup in ipairs(config.flightGroups) do
        if flightGroup.task == "CAS" then
            DCC_CAS.Register(
                flightGroup.groupId,
                flightGroup.name,
                flightGroup.jtacName,
                flightGroup.targetGroupName,
                flightGroup.laserCode
            )
        end
    end

    DCC_CAS.Start()
else
    debugLog("No config.flightGroups found for CAS setup")
end
