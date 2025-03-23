// zoom-call-manager url scheme
export enum ZoomCallManagerType {
  REQUEST_ZOOM_CODE,
  RESPONSE_ZOOM_CODE,
}
export type ZoomCallManagerMessage = {
  type: ZoomCallManagerType;
  data: any;
};

export type TelHandler = {
  hash: string;
  progId: string;
};
