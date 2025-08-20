/* eslint-disable */

import { useEffect, useState } from "react"
import { Loader2, X, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardFooter } from "@/components/ui/card.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { SelectMembre } from "@/features/public/comps/commande/membres.tsx"
import { FormMousses } from "@/features/public/comps/commande/mousse.tsx"
import { FormBois } from "@/features/public/comps/commande/bois.tsx"
import { FormAutre } from "@/features/public/comps/commande/autre.tsx"
import type { Mousse, Bois, Autre, Member } from "@/services/type.ts"
import { createSelection, fetchUsers, fetchSelectionByMembre, updateSelection } from "@/services/api.ts"

export default function CommandePage() {
  const [membreSelectionne, setMembreSelectionne] = useState<string | null>(null)
  const [selectionId, setSelectionId] = useState<string | null>(null)
  const [mousses, setMousses] = useState<Mousse[]>([])
  const [bois, setBois] = useState<Bois[]>([])
  const [autres, setAutres] = useState<Autre[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [membres, setMembres] = useState<Member[]>([])
  const [isLoadingMembres, setIsLoadingMembres] = useState(true)

  const dateClotureCommande = new Date("2025-02-15") // Date de clôture
  const formatDateFR = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isCommandeOuverte = () => {
    const maintenant = new Date()
    return maintenant <= dateClotureCommande
  }

  useEffect(() => {
    const chargerMembres = async () => {
      try {
        const donneesMembers = await fetchUsers()
        setMembres(donneesMembers)
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error)
        alert("Impossible de charger la liste des membres.")
      } finally {
        setIsLoadingMembres(false)
      }
    }

    chargerMembres()
  }, [])

  const handleSelectMembre = async (membreNom: string) => {
    setIsLoading(true)
    try {
      const existingSelection = await fetchSelectionByMembre(membreNom)
      if (existingSelection) {
        setSelectionId(existingSelection.id)
        setMousses(existingSelection.mousses || [])
        setBois(existingSelection.bois || [])
        setAutres(existingSelection.autres || [])
      } else {
        setSelectionId(null)
        setMousses([])
        setBois([])
        setAutres([])
      }
      setMembreSelectionne(membreNom)
    } catch (error) {
      console.error("Erreur lors de la récupération de la sélection:", error)
      alert("Impossible de charger les données existantes. Une nouvelle sélection sera créée.")
      setMembreSelectionne(membreNom)
      setSelectionId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMousse = (nouvelleMousse: Mousse) => setMousses([...mousses, nouvelleMousse])
  const handleAddBois = (nouveauBois: Bois) => setBois([...bois, nouveauBois])
  const handleAddAutre = (nouvelAutre: Autre) => setAutres([...autres, nouvelAutre])
  const handleRemoveMousse = (index: number) => setMousses(mousses.filter((_, i) => i !== index))
  const handleRemoveBois = (index: number) => setBois(bois.filter((_, i) => i !== index))
  const handleRemoveAutre = (index: number) => setAutres(autres.filter((_, i) => i !== index))

  const calculerTotal = () => {
    const totalMousses = mousses.reduce((acc, item) => acc + (item.prix || 0), 0)
    const totalBois = bois.reduce((acc, item) => acc + (item.prix || 0), 0)
    const totalAutres = autres.reduce((acc, item) => acc + (item.prix || 0), 0)
    return totalMousses + totalBois + totalAutres
  }

  const handleSaveSelection = async () => {
    if (!membreSelectionne) return
    setIsLoading(true)

    const selectionData = {
      membre: membreSelectionne,
      mousses,
      bois,
      autres,
      totalEstime: calculerTotal(),
      dateEnregistrement: new Date().toISOString(),
    }

    try {
      if (selectionId) {
        const updated = await updateSelection(selectionId, selectionData)
        console.log("Sélection mise à jour :", updated)
        alert("Votre sélection a été mise à jour !")
      } else {
        const created = await createSelection(selectionData)
        setSelectionId(created.id)
        console.log("Sélection enregistrée :", created)
        alert("Votre sélection a bien été enregistrée !")
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      alert("Une erreur est survenue lors de l'enregistrement.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingMembres) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#F1C40F]" />
      </div>
    )
  }

  if (isLoading && !membreSelectionne) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#F1C40F]" />
      </div>
    )
  }

  if (!membreSelectionne) {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#F1C40F] to-[#D4AC0D] text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Commande de matériel</h1>
              <p className="opacity-90">Sélectionnez votre matériel pour la saison</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm opacity-90">Date limite</span>
              </div>
              <p className="text-lg font-bold">{formatDateFR(dateClotureCommande)}</p>
            </div>
          </div>
        </div>

        {isCommandeOuverte() ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Commandes ouvertes !</strong> Vous pouvez encore passer votre commande jusqu'au{" "}
              {formatDateFR(dateClotureCommande)}.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Commandes fermées.</strong> La période de commande s'est terminée le{" "}
              {formatDateFR(dateClotureCommande)}.
            </AlertDescription>
          </Alert>
        )}

        <SelectMembre membres={membres} onSelect={handleSelectMembre} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-[#F1C40F] to-[#D4AC0D] text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Enregistrement de matériel</h1>
            <p className="opacity-90">
              Sélection pour : <span className="font-semibold">{membreSelectionne}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm opacity-90">Date limite</span>
            </div>
            <p className="text-lg font-bold">{formatDateFR(dateClotureCommande)}</p>
          </div>
        </div>
      </div>

      {!isCommandeOuverte() && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Attention :</strong> La période de commande est fermée depuis le {formatDateFR(dateClotureCommande)}
            . Contactez le comité pour toute modification.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-white border border-[#E0E0E0]">
        <CardContent className="p-6">
          <Tabs defaultValue="mousses" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#F9F9F9]">
              <TabsTrigger value="mousses" className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-white">
                Mousses
              </TabsTrigger>
              <TabsTrigger value="bois" className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-white">
                Bois
              </TabsTrigger>
              <TabsTrigger value="autre" className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-white">
                Autre
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mousses" className="mt-6">
              <FormMousses mousses={mousses} onAddMousse={handleAddMousse} onRemoveMousse={handleRemoveMousse} />
            </TabsContent>
            <TabsContent value="bois" className="mt-6">
              <FormBois bois={bois} onAddBois={handleAddBois} onRemoveBois={handleRemoveBois} />
            </TabsContent>
            <TabsContent value="autre" className="mt-6">
              <FormAutre autres={autres} onAddAutre={handleAddAutre} onRemoveAutre={handleRemoveAutre} />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-4 bg-[#F9F9F9] border-t border-[#E0E0E0]">
          <div className="pt-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Récapitulatif de la sélection
              {(mousses.length > 0 || bois.length > 0 || autres.length > 0) && (
                <Badge variant="secondary" className="bg-[#F1C40F] text-white">
                  {mousses.length + bois.length + autres.length} article(s)
                </Badge>
              )}
            </h3>
            {mousses.length === 0 && bois.length === 0 && autres.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-[#E0E0E0]">
                <p>Aucun article dans la sélection.</p>
                <p className="text-sm mt-1">Utilisez les onglets ci-dessus pour ajouter des articles.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#E0E0E0] p-4">
                <ul className="text-sm space-y-3">
                  {mousses.map((m, i) => (
                    <li
                      key={`mousse-recap-${i}`}
                      className="flex items-center justify-between p-3 bg-[#FFF8DC] rounded-lg"
                    >
                      <span>
                        <strong>Mousse:</strong> {`${m.marque} ${m.nom} (${m.epaisseur}, ${m.couleur})`}
                        {m.prix && <span className="font-semibold text-[#D4AC0D] ml-2">{m.prix.toFixed(2)} €</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100"
                        onClick={() => handleRemoveMousse(i)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                  {bois.map((b, i) => (
                    <li
                      key={`bois-recap-${i}`}
                      className="flex items-center justify-between p-3 bg-[#FFF8DC] rounded-lg"
                    >
                      <span>
                        <strong>Bois:</strong> {`${b.marque} ${b.nom} (${b.type})`}
                        {b.prix && <span className="font-semibold text-[#D4AC0D] ml-2">{b.prix.toFixed(2)} €</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100"
                        onClick={() => handleRemoveBois(i)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                  {autres.map((a, i) => (
                    <li
                      key={`autre-recap-${i}`}
                      className="flex items-center justify-between p-3 bg-[#FFF8DC] rounded-lg"
                    >
                      <span>
                        <strong>Autre:</strong> {a.nom}
                        {a.prix && <span className="font-semibold text-[#D4AC0D] ml-2">{a.prix.toFixed(2)} €</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100"
                        onClick={() => handleRemoveAutre(i)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex justify-end items-center">
            <div className="bg-gradient-to-r from-[#F1C40F] to-[#D4AC0D] text-white px-6 py-3 rounded-lg">
              <span className="text-lg font-bold">Total estimé : {calculerTotal().toFixed(2)} €</span>
            </div>
          </div>

          <Button
            onClick={handleSaveSelection}
            size="lg"
            className="w-full bg-[#F1C40F] hover:bg-[#D4AC0D] text-white font-semibold py-3"
            disabled={isLoading || !isCommandeOuverte()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : !isCommandeOuverte() ? (
              "Commandes fermées"
            ) : (
              "Enregistrer la sélection"
            )}
          </Button>

          {!isCommandeOuverte() && (
            <p className="text-sm text-center text-muted-foreground">
              Pour toute modification, contactez le comité du club
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
