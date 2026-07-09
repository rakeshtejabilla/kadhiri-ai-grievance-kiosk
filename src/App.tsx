import { HashRouter } from "react-router-dom";
import { AppRoutes } from "@/router";
import { useKioskMachine } from "@/hooks/useKioskMachine";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

function KioskRoot() {
  useKioskMachine();
  useMediaRecorder();
  return <AppRoutes />;
}

export default function App() {
  return (
    <HashRouter>
      <KioskRoot />
    </HashRouter>
  );
}
