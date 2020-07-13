declare type SegmentObjectDefinition = any
declare type SegmentIdentifyProtocol = any
declare type SegmentGroupProtocol = any
declare type SegmentEvents = string
declare type SegmentTrackProtocolUnion = {event: string, properties: {[k:string]:any}}
declare type SegmentTrackProtocol<SegmentEvents> = {[k:string]:any}
