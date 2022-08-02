export async function onTrack(event: SegmentTrackEvent, settings: FunctionSettings) {
  throw new EventNotSupported('Track is not supported')
}

export async function onIdentify(event: SegmentIdentifyEvent, settings: FunctionSettings) {
  throw new EventNotSupported('Identify is not supported')
}

export async function onGroup(event: SegmentGroupEvent, settings: FunctionSettings) {
  throw new EventNotSupported('Group is not supported')
}

export async function onPage(event: SegmentPageEvent, settings: FunctionSettings) {
  throw new EventNotSupported('Page is not supported')
}

export async function onAlias(event: SegmentAliasEvent, settings: FunctionSettings) {
  throw new EventNotSupported('Alias is not supported')
}

export async function onScreen(event: SegmentScreenEvent, settings: FunctionSettings) {
  throw new EventNotSupported('Screen is not supported')
}