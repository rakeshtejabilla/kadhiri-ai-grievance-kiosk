import { Route, Routes } from "react-router-dom";
import { VaaniScreen } from "@/pages/VaaniScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<VaaniScreen />} />
    </Routes>
  );
}
