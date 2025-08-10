import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </AuthProvider>
  );
}
