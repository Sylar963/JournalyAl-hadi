/// <reference types="vite/client" />
import { ThreeElements } from '@react-three/fiber'

declare const __APP_VERSION__: string;

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements extends ThreeElements { }
        }
    }
}
