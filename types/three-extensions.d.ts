declare module 'three/examples/jsm/loaders/FBXLoader' {
    import { Loader } from 'three';
    import { LoadingManager, Group } from 'three';
  
    export class FBXLoader extends Loader {
      constructor(manager?: LoadingManager);
      load(
        url: string,
        onLoad: (object: Group) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
      ): void;
      parse(FBXBuffer: ArrayBuffer | string, path: string): Group;
    }
  }