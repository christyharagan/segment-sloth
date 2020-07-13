declare type SegmentEvents = string
declare type SegmentTrackProtocolUnion = {event: string, properties: {[k:string]:any}}
declare type SegmentTrackProtocol<E extends SegmentEvents> = {[k:string]:any}
declare type SegmentObjectDefinition = {}
declare type SegmentIdentifyProtocol = object
declare type SegmentGroupProtocol = object