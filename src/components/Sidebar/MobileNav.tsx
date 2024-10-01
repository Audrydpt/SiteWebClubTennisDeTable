import { Link } from "react-router-dom"
import {
  Camera,
  FileOutput,
  Fingerprint,
  Gauge,
  MapPinHouse,
  Menu,
  Settings,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function MobileNav() {
    return (
      <header className="md:hidden flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <img className="h-10" src="logo.svg" alt="ACIC" />
              </Link>

              <Link
                to="/dashboard"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <Gauge className="h-5 w-5" />
                Dashboard
              </Link>

              <Link
                to="/maps"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
              >
                <MapPinHouse className="h-5 w-5" />
                Maps
              </Link>

              <Link
                to="/forensic"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <Fingerprint className="h-5 w-5" />
                Forensic
              </Link>

              <div className="my-4 h-px bg-gray-200" />

              <Link
                to="/cameras"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <Camera className="h-5 w-5" />
                Cameras
              </Link>

              <Link
                to="/outputs"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <FileOutput className="h-5 w-5" />
                Outputs
              </Link>

              <Link
                to="/settings"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>

              <Link
                to="/maintenance"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <Wrench className="h-5 w-5" />
                Maintenance
              </Link>
            </nav>
            <div className="mt-auto">
              <Button size="lg" className="w-full">
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    )
}