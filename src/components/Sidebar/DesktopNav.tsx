import { Link } from "react-router-dom"
import {
  Camera,
  FileOutput,
  Fingerprint,
  Gauge,
  Map,
  Settings,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export default function DesktopNav() {
  
    return (
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img className="h-10" src="logo.svg" alt="ACIC" />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">

              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Gauge className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                to="/maps"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Map className="h-4 w-4" />
                Maps
              </Link>

              <Link
                to="/forensic"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Fingerprint className="h-4 w-4" />
                Forensic
              </Link>

              <div className="my-4 h-px bg-gray-200" />

              <Link
                to="/cameras"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Camera className="h-4 w-4" />
                Cameras
              </Link>

              <Link
                to="/outputs"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <FileOutput className="h-4 w-4" />
                Outputs
              </Link>

              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              <Link
                to="/maintenance"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Wrench className="h-4 w-4" />
                Maintenance
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Button size="sm" className="w-full">
              Logout
            </Button>
          </div>
        </div>
      </aside>
    )
}