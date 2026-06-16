local logName = 'DCC.IADS'

local function debugLog(message)
    env.info(logName .. ': ' .. tostring(message))
end

local function getStaticObject(name)
    if not name or name == "" or not StaticObject or not StaticObject.getByName then
        return nil
    end

    local object = StaticObject.getByName(name)
    if object and object:isExist() then
        return object
    end

    return nil
end

local function collectStaticObjects(names)
    local objects = {}
    for _, name in ipairs(names or {}) do
        local object = getStaticObject(name)
        if object then
            objects[#objects + 1] = object
        else
            debugLog('Skipping missing infrastructure object ' .. tostring(name))
        end
    end
    return objects
end

local function addPowerSources(element, powerSources)
    if not element or not element.addPowerSource then
        return
    end

    for _, powerSource in ipairs(powerSources) do
        element:addPowerSource(powerSource)
    end
end

local function addConnectionNodes(element, connectionNodes)
    if not element or not element.addConnectionNode then
        return
    end

    for _, connectionNode in ipairs(connectionNodes) do
        element:addConnectionNode(connectionNode)
    end
end

local function configureRadarElements(elements, powerSources, connectionNodes)
    for i = 1, #elements do
        local element = elements[i]
        addPowerSources(element, powerSources)
        addConnectionNodes(element, connectionNodes)

        if element.setHARMDetectionChance then
            element:setHARMDetectionChance(90)
        end
        if element.setCanEngageHARM then
            element:setCanEngageHARM(true)
        end
    end
end

local function setupIads(config)
    if not SkynetIADS then
        debugLog('SkynetIADS is not loaded')
        return
    end

    if not mist or not mist.DBs then
        debugLog('MIST is not ready')
        return
    end

    local iads = SkynetIADS:create(config.name or 'DCC-Red-IADS')
    local commandCenters = collectStaticObjects(config.commandCenters)
    local powerSources = collectStaticObjects(config.powerSources)
    local connectionNodes = collectStaticObjects(config.connectionNodes)

    for _, commandCenter in ipairs(commandCenters) do
        local wrappedCommandCenter = iads:addCommandCenter(commandCenter)
        addPowerSources(wrappedCommandCenter, powerSources)
        addConnectionNodes(wrappedCommandCenter, connectionNodes)
    end

    local samSites = iads:addSAMSitesByPrefix(config.samPrefix or 'SAM-')
    local ewRadars = iads:addEarlyWarningRadarsByPrefix(config.ewrPrefix or 'IADS-EWR-')

    configureRadarElements(samSites, powerSources, connectionNodes)
    configureRadarElements(ewRadars, powerSources, connectionNodes)

    iads:activate()
    DCC_IADS = DCC_IADS or {}
    DCC_IADS.red = iads

    debugLog(
        string.format(
            'Activated %s with %d SAMs, %d EWRs, %d command centers, %d power sources, %d connection nodes',
            config.name or 'DCC-Red-IADS',
            #samSites,
            #ewRadars,
            #commandCenters,
            #powerSources,
            #connectionNodes
        )
    )
end

if DCC_IADS_CONFIG then
    setupIads(DCC_IADS_CONFIG)
else
    debugLog('No IADS config found')
end
