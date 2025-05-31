import { AlertCircle, Terminal } from 'lucide-react';

import Header from '@/components/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tableData = [
  { id: 1, name: 'John Doe', role: 'Developer', status: 'Active' },
  { id: 2, name: 'Jane Smith', role: 'Designer', status: 'Offline' },
  { id: 3, name: 'Mike Johnson', role: 'Manager', status: 'Active' },
];

export default function Theme() {
  return (
    <div className="p-6 space-y-8">
      <Header title="Thème" />

      {/* Couleurs de base */}
      <Card>
        <CardHeader>
          <CardTitle>Couleurs de base</CardTitle>
          <CardDescription>
            Les classes de couleurs principales du thème
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-12 w-full bg-background border rounded-md" />
              <p className="text-sm">bg-background</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-foreground border rounded-md" />
              <p className="text-sm">bg-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-primary border rounded-md" />
              <p className="text-sm">bg-primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-secondary border rounded-md" />
              <p className="text-sm">bg-secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-muted border rounded-md" />
              <p className="text-sm">bg-muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-accent border rounded-md" />
              <p className="text-sm">bg-accent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemples de composants */}
      <Card>
        <CardHeader>
          <CardTitle>Exemples de composants</CardTitle>
          <CardDescription>
            Composants avec les différentes variantes de couleur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Alerts</h3>
            <div className="space-y-2">
              <Alert>
                <Terminal className="size-4" />
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                  This is a default alert using text-foreground
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Destructive Alert</AlertTitle>
                <AlertDescription>
                  This is a destructive alert using destructive colors
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Text Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Text Colors</h3>
            <div className="space-y-2">
              <p className="text-accent">text-accent</p>
              <p className="text-accent-foreground">text-accent-foreground</p>
              <p className="text-foreground">text-foreground (Default text)</p>
              <p className="text-muted">text-muted</p>
              <p className="text-muted-foreground">text-muted-foreground</p>
              <p className="text-primary">text-primary (Primary text)</p>
              <p className="text-secondary">text-secondary (Secondary text)</p>
              <p className="text-destructive">
                text-destructive (Destructive text)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Card Default</CardTitle>
            <CardDescription>Using bg-card</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-card-foreground">Default card content</p>
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Card Muted</CardTitle>
            <CardDescription>Using bg-muted</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Muted card content</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Example */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs Example</CardTitle>
          <CardDescription>
            Exemple d&apos;utilisation des onglets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="mt-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Account Tab Content</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings and preferences.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="password" className="mt-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Password Tab Content</h4>
                <p className="text-sm text-muted-foreground">
                  Change your password and security settings.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Settings Tab Content</h4>
                <p className="text-sm text-muted-foreground">
                  Customize your application settings.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Table Example */}
      <Card>
        <CardHeader>
          <CardTitle>Table Example</CardTitle>
          <CardDescription>
            Exemple de tableau avec styles du thème
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Name</th>
                  <th className="py-3 px-4 text-left font-medium">Role</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-3 px-4">{row.name}</td>
                    <td className="py-3 px-4">{row.role}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          row.status === 'Active' ? 'default' : 'secondary'
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Example */}
      <Card>
        <CardHeader>
          <CardTitle>Form Example</CardTitle>
          <CardDescription>
            Exemple de formulaire avec les composants shadcn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Submit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
