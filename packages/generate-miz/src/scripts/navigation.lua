local logName = 'DCC.NAVIGATION'

local function debugLog(message)
    env.info(logName .. ': ' .. tostring(message))
end

DCC_NAVIGATION = DCC_NAVIGATION or {}
DCC_NAVIGATION.groups = DCC_NAVIGATION.groups or {}

local metersPerNauticalMile = 1852

local function sendMessageToUnits(text, unitNames, duration)
    if mist and mist.message then
        mist.message.add({
            text = text,
            displayTime = duration or 15,
            msgFor = { units = unitNames }
        })
        return
    end

    trigger.action.outText(text, duration or 15)
end

local function getObjectName(object)
    if not object or not object.getName then
        return nil
    end

    local ok, name = pcall(function() return object:getName() end)
    if ok then
        return name
    end

    return nil
end

local function getLeadUnit(groupName)
    local group = Group.getByName(groupName)
    if not group then
        return nil
    end

    for _, unit in ipairs(group:getUnits()) do
        if unit and unit:isExist() and unit:getLife() > 0 then
            return unit
        end
    end

    return nil
end

local function formatBearing(fromPoint, targetPoint)
    local dx = targetPoint.x - fromPoint.x
    local dz = targetPoint.z - fromPoint.z
    if dx == 0 and dz == 0 then
        return '---'
    end

    local degrees = math.deg(math.atan2(dx, dz))
    local normalized = math.floor((degrees + 360) % 360 + 0.5)
    if normalized == 0 then
        normalized = 360
    end

    return string.format('%03d', normalized)
end

function DCC_NAVIGATION.Register(groupId, groupName, unitNames, navigation)
    if not groupId or not groupName or not navigation or (not navigation.targetPoint and not navigation.landingPoint) then
        debugLog('Skipping incomplete navigation config')
        return
    end

    DCC_NAVIGATION.groups[groupName] = {
        groupId = groupId,
        groupName = groupName,
        unitNames = unitNames or {},
        navigation = navigation
    }
end

local function createVectorMessage(prefix, fromPoint, destinationPoint, destinationLabel)
    local dx = destinationPoint.x - fromPoint.x
    local dz = destinationPoint.z - fromPoint.z
    local distanceMeters = math.sqrt(dx * dx + dz * dz)
    local bearing = formatBearing(fromPoint, destinationPoint)
    local distanceNm = distanceMeters / metersPerNauticalMile
    local distanceKm = distanceMeters / 1000

    return string.format(
        '%s: BRG %s / %.1f NM / %.1f KM / %s',
        prefix,
        bearing,
        distanceNm,
        distanceKm,
        destinationLabel
    )
end

function DCC_NAVIGATION.RequestTargetVector(groupName)
    local groupConfig = DCC_NAVIGATION.groups[groupName]
    if not groupConfig then
        return
    end

    local unit = getLeadUnit(groupConfig.groupName)
    if not unit then
        sendMessageToUnits('TARGET VECTOR: no live flight lead found.', groupConfig.unitNames, 10)
        return
    end

    local fromPoint = unit:getPoint()
    local targetPoint = groupConfig.navigation.targetPoint
    local targetLabel = groupConfig.navigation.targetLabel or 'Target'

    local message = createVectorMessage('TARGET VECTOR', fromPoint, targetPoint, targetLabel)

    if groupConfig.navigation.tacan then
        local tacan = groupConfig.navigation.tacan
        message = message .. string.format(
            '\nTARGET TACAN: %d%s %s',
            tacan.channel,
            tacan.band or 'X',
            tacan.callsign or ''
        )
    end

    sendMessageToUnits(message, groupConfig.unitNames, 20)
end

function DCC_NAVIGATION.RequestLandingVector(groupName)
    local groupConfig = DCC_NAVIGATION.groups[groupName]
    if not groupConfig then
        return
    end

    local unit = getLeadUnit(groupConfig.groupName)
    if not unit then
        sendMessageToUnits('LANDING VECTOR: no live flight lead found.', groupConfig.unitNames, 10)
        return
    end

    local fromPoint = unit:getPoint()
    local landingPoint = groupConfig.navigation.landingPoint
    local landingLabel = groupConfig.navigation.landingLabel or 'Landing Airport'

    local message = createVectorMessage('LANDING VECTOR', fromPoint, landingPoint, landingLabel)

    if groupConfig.navigation.landingTacan then
        local tacan = groupConfig.navigation.landingTacan
        message = message .. string.format(
            '\nLANDING TACAN: %s%s %s',
            tostring(tacan.channel),
            tacan.band or 'X',
            tacan.callsign or ''
        )
    end

    sendMessageToUnits(message, groupConfig.unitNames, 20)
end

function DCC_NAVIGATION.CreateMenu(groupName)
    local groupConfig = DCC_NAVIGATION.groups[groupName]
    if not groupConfig then
        return
    end

    local flightGroup = Group.getByName(groupConfig.groupName)
    if flightGroup and flightGroup.getID then
        groupConfig.groupId = flightGroup:getID()
    end

    if groupConfig.menuPath then
        missionCommands.removeItemForGroup(groupConfig.groupId, groupConfig.menuPath)
        groupConfig.menuPath = nil
    end

    groupConfig.menuPath = missionCommands.addSubMenuForGroup(groupConfig.groupId, 'Navigation')
    if groupConfig.navigation.targetPoint then
        missionCommands.addCommandForGroup(
            groupConfig.groupId,
            'Request Target Vector',
            groupConfig.menuPath,
            DCC_NAVIGATION.RequestTargetVector,
            groupName
        )
    end

    if groupConfig.navigation.landingPoint then
        missionCommands.addCommandForGroup(
            groupConfig.groupId,
            'Request Landing Airport Vector',
            groupConfig.menuPath,
            DCC_NAVIGATION.RequestLandingVector,
            groupName
        )
    end
end

function DCC_NAVIGATION:onEvent(event)
    if not event or not event.initiator then
        return
    end

    if event.id == world.event.S_EVENT_BIRTH then
        local unit = event.initiator
        if not unit.getGroup then return end

        local group = unit:getGroup()
        local groupName = getObjectName(group)
        if groupName and DCC_NAVIGATION.groups[groupName] then
            DCC_NAVIGATION.groups[groupName].groupId = group:getID()
            DCC_NAVIGATION.CreateMenu(groupName)
        end
    end
end

function DCC_NAVIGATION.Start()
    world.addEventHandler(DCC_NAVIGATION)

    for groupName in pairs(DCC_NAVIGATION.groups) do
        DCC_NAVIGATION.CreateMenu(groupName)
    end
end

if config and config.flightGroups then
    for _, flightGroup in ipairs(config.flightGroups) do
        if flightGroup.navigation then
            DCC_NAVIGATION.Register(
                flightGroup.groupId,
                flightGroup.name,
                flightGroup.unitNames,
                flightGroup.navigation
            )
        end
    end

    DCC_NAVIGATION.Start()
else
    debugLog('No config.flightGroups found for navigation setup')
end
