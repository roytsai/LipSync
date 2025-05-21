import { OrbitControls, OrbitControlsProps } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";

type Props = React.ComponentProps<typeof OrbitControls>;

export default function CameraScene(props: Props) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleChange = () => {
      //console.log("Camera position:", camera.position.toArray());
      //console.log("Camera rotation:", camera.rotation.toArray());
      //console.log("Camera zoom:", camera.zoom);
    };

    controls.addEventListener("change", handleChange);
    return () => {
      controls.removeEventListener("change", handleChange);
    };
  }, [camera]);

  return <OrbitControls ref={controlsRef} {...props} />;
}
