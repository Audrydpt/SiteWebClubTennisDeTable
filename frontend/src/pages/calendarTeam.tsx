/* eslint-disable */
import { useState, useEffect } from "react"
import { Loader2, Calendar, Home, Plane, Trophy, Filter, ArrowLeft } from "lucide-react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { fetchSaisonEnCours } from "@/services/api"
import type { Saison, Match, Equipe } from "@/services/type.ts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table.tsx"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CalendrierPage() {
  const [saison, setSaison] = useState<Saison | null>(null)
  const [equipeSelectionnee, setEquipeSelectionnee] = useState<Equipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filtre, setFiltre] = useState<"tous" | "passes" | "futurs">("tous")

  const { nomEquipe } = useParams<{ nomEquipe?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSaisonEnCours()
      .then((data) => {
        setSaison(data)
        if (data && data.equipesClub.length > 0) {
          // Si un nom d'équipe est fourni dans l'URL, la sélectionner
          if (nomEquipe) {
            const equipeDecoded = decodeURIComponent(nomEquipe)
            const equipe = data.equipesClub.find(
              (e: { nom: string }) => e.nom === equipeDecoded
            );
            if (equipe) {
              setEquipeSelectionnee(equipe)
            } else {
              // Si l'équipe n'est pas trouvée, sélectionner la première
              setEquipeSelectionnee(data.equipesClub[0])
            }
          } else {
            setEquipeSelectionnee(data.equipesClub[0])
          }
        }
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des données:", error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [nomEquipe])

  const handleSelectEquipe = (equipeId: string) => {
    const equipe = saison?.equipesClub.find((e) => e.id === equipeId)
    if (equipe) {
      setEquipeSelectionnee(equipe)
    }
  }

  const getMatchsPourEquipe = () => {
    if (!saison || !equipeSelectionnee) return []

    const allMatches = saison.calendrier.filter(
      (match) =>
        match.serieId === equipeSelectionnee.serieId &&
        (match.domicile === equipeSelectionnee.nom || match.exterieur === equipeSelectionnee.nom),
    )

    const aujourdhui = new Date()

    const hasValidScore = (match: Match) =>
      match.score &&
      (match.score === "ff-d" ||
        match.score === "ff-e" ||
        match.score === "fg-d" ||
        match.score === "fg-e" ||
        match.score.toLowerCase() === 'bye' || // Les matchs BYE sont considérés comme terminés
        (match.score.includes("-") && match.score.split("-").every((s) => !isNaN(Number.parseInt(s, 10)))))

    switch (filtre) {
      case "passes":
        return allMatches.filter(
          (match) =>
            hasValidScore(match) || // Match avec un score (terminé)
            (match.date && new Date(match.date) < aujourdhui), // Match avec date passée
        )
      case "futurs":
        return allMatches.filter(
          (match) =>
            !hasValidScore(match) && // Match sans score (non terminé)
            (!match.date || new Date(match.date) >= aujourdhui), // Match sans date ou date future
        )
      default:
        return allMatches
    }
  }

  const matchs = getMatchsPourEquipe()
  const matchsParSemaine = matchs.reduce(
    (acc, match) => {
      ;(acc[match.semaine] = acc[match.semaine] || []).push(match)
      return acc
    },
    {} as Record<number, Match[]>,
  )

  // Calculer les statistiques
  const calculerStatistiques = () => {
    if (!equipeSelectionnee || !saison) return { victoires: 0, defaites: 0, nuls: 0, aJouer: 0 }

    // Exclure les matchs BYE des statistiques
    const matchsValides = matchs.filter((match) =>
      !match.domicile.toLowerCase().includes('bye') &&
      !match.exterieur.toLowerCase().includes('bye') &&
      match.score?.toLowerCase() !== 'bye'
    );

    const matchsTermines = matchsValides.filter((match) => match.score)

    let victoires = 0
    let defaites = 0
    let nuls = 0

    matchsTermines.forEach((match) => {
      const isDomicile = match.domicile === equipeSelectionnee.nom

      // Cas de forfait
      if (match.score === "ff-d") {
        if (isDomicile) {
          defaites += 1
        } else {
          victoires += 1
        }
        return
      }

      if (match.score === "ff-e") {
        if (isDomicile) {
          victoires += 1
        } else {
          defaites += 1
        }
        return
      }

      // Cas normal avec score numérique
      const [scoreDomicile, scoreExterieur] = match.score.split("-").map((s) => Number.parseInt(s, 10))

      if (isDomicile) {
        if (scoreDomicile > scoreExterieur) {
          victoires += 1
        } else if (scoreDomicile < scoreExterieur) {
          defaites += 1
        } else {
          nuls += 1
        }
      } else if (scoreExterieur > scoreDomicile) {
        victoires += 1
      } else if (scoreExterieur < scoreDomicile) {
        defaites += 1
      } else {
        nuls += 1
      }
    })

    return {
      victoires,
      defaites,
      nuls,
      aJouer: matchsValides.length - matchsTermines.length,
    }
  }

  const stats = calculerStatistiques()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#F1C40F]" />
      </div>
    )
  }

  if (!saison) {
    return (
      <div className="min-h-screen bg-white">
        <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
            <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
            <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
            <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Calendrier & <span className="text-[#F1C40F] drop-shadow-lg">Compétitions</span>
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
              Suivez les matchs de vos équipes favorites
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger les données de la saison en cours.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const getBadgeStyle = (res: string): string => {
    if (res === "victoire") return "bg-green-100 text-green-800 ml-2"
    if (res === "defaite") return "bg-red-100 text-red-800 ml-2"
    return "bg-blue-100 text-blue-800 ml-2"
  }

  const getScoreStyle = (res: string | null, isOpponent: boolean): string => {
    if (!res) return ""
    if (res === "victoire" && !isOpponent) return "text-green-600"
    if (res === "defaite" && isOpponent) return "text-green-600"
    if (res === "defaite" && !isOpponent) return "text-red-600"
    if (res === "victoire" && isOpponent) return "text-red-600"
    return ""
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Bouton retour vers les équipes */}
          <div className="mb-6">
            <Link
              to="/competition/equipes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3A3A3A] text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux équipes
            </Link>
          </div>

          {saison?.equipesClub.length > 0 && (
            <Card className="shadow-2xl border-0 mb-8">
              <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="bg-[#F1C40F] p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-[#3A3A3A]" />
                  </div>
                  Sélection d'équipe
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full">
                  <Select onValueChange={handleSelectEquipe} value={equipeSelectionnee?.id || ""}>
                    <SelectTrigger className="w-full text-base py-6">
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {saison.equipesClub.map((equipe) => (
                        <SelectItem key={equipe.id} value={equipe.id}>
                          {equipe.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {equipeSelectionnee && (
            <Card className="shadow-2xl border-0 mb-8">
              <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="bg-[#F1C40F] p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-[#3A3A3A]" />
                  </div>
                  Statistiques: {equipeSelectionnee.nom}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">{stats.victoires}</div>
                      <div className="text-lg font-semibold text-[#3A3A3A]">Victoires</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-red-600 mb-2">{stats.defaites}</div>
                      <div className="text-lg font-semibold text-[#3A3A3A]">Défaites</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{stats.nuls}</div>
                      <div className="text-lg font-semibold text-[#3A3A3A]">Nuls</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-[#F1C40F] to-yellow-400">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-[#3A3A3A] mb-2">{stats.aJouer}</div>
                      <div className="text-lg font-semibold text-[#3A3A3A]">À jouer</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {equipeSelectionnee && (
            <Card className="shadow-2xl border-0 mb-8">
              <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="bg-[#F1C40F] p-2 rounded-full">
                    <Filter className="h-5 w-5 text-[#3A3A3A]" />
                  </div>
                  Filtrer les matchs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="tous" onValueChange={(value) => setFiltre(value as "tous" | "passes" | "futurs")}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger
                      value="tous"
                      className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-[#3A3A3A]"
                    >
                      Tous les matchs
                    </TabsTrigger>
                    <TabsTrigger
                      value="passes"
                      className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-[#3A3A3A]"
                    >
                      Matchs passés
                    </TabsTrigger>
                    <TabsTrigger
                      value="futurs"
                      className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-[#3A3A3A]"
                    >
                      Matchs à venir
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {!equipeSelectionnee ? (
            <Card className="shadow-2xl border-0 text-center">
              <CardContent className="p-12">
                <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-[#3A3A3A] mb-2">Aucune équipe sélectionnée</h3>
                <p className="text-gray-600">Veuillez choisir une équipe pour voir son calendrier.</p>
              </CardContent>
            </Card>
          ) : Object.keys(matchsParSemaine).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(matchsParSemaine).map(([semaine, matchsDeLaSemaine]) => (
                <Card
                  key={semaine}
                  className="shadow-2xl border-0 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="bg-[#F1C40F] p-2 rounded-full">
                        <Calendar className="h-5 w-5 text-[#3A3A3A]" />
                      </div>
                      Semaine {semaine}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {matchsDeLaSemaine.map((match) => {
                          const isDomicile = match.domicile === equipeSelectionnee.nom
                          const adversaire = isDomicile ? match.exterieur : match.domicile

                          let resultat = null
                          let scoreEquipe = null
                          let scoreAdversaire = null

                          // Gestion des forfaits
                          if (match.score === "ff-d") {
                            resultat = isDomicile ? "defaite" : "victoire"
                          } else if (match.score === "ff-e") {
                            resultat = !isDomicile ? "defaite" : "victoire"
                          } else if (match.score) {
                            // Cas normal avec score numérique
                            const scoreInfo = match.score.split("-").map((s) => Number.parseInt(s, 10))

                            scoreEquipe = isDomicile ? scoreInfo[0] : scoreInfo[1]
                            scoreAdversaire = isDomicile ? scoreInfo[1] : scoreInfo[0]

                            if (scoreEquipe > scoreAdversaire) {
                              resultat = "victoire"
                            } else if (scoreEquipe < scoreAdversaire) {
                              resultat = "defaite"
                            } else {
                              resultat = "nul"
                            }
                          }

                          return (
                            <TableRow key={match.id} className="hover:bg-gray-50/70 transition-colors duration-200">
                              <TableCell className="w-12 text-center py-4">
                                {isDomicile ? (
                                  <span title="Match à domicile">
                                    <Home className="h-6 w-6 text-[#F1C40F] mx-auto" />
                                  </span>
                                ) : (
                                  <span title="Match à l'extérieur">
                                    <Plane className="h-6 w-6 text-[#3A3A3A] mx-auto" />
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-semibold text-[#3A3A3A] text-base py-4">
                                {adversaire}
                              </TableCell>
                              <TableCell className="w-32 text-center py-4">
                                {match.score ? (
                                  <div className="flex items-center justify-center gap-2">
                                    {match.score.toLowerCase() === 'bye' ? (
                                      <div className="text-base font-bold text-blue-600">
                                        BYE
                                      </div>
                                    ) : match.score === "ff-d" ? (
                                      <div className="text-base font-bold">
                                        <span className={getScoreStyle(resultat, false)}>{scoreEquipe}</span>
                                        <span className="text-gray-400 mx-1">-</span>
                                        <span className={getScoreStyle(resultat, true)}>{scoreAdversaire}</span>
                                        <span className="text-red-600 ml-2 text-sm">(FF Domicile)</span>
                                      </div>
                                    ) : match.score === "ff-e" ? (
                                      <div className="text-base font-bold">
                                        <span className={getScoreStyle(resultat, false)}>{scoreEquipe}</span>
                                        <span className="text-gray-400 mx-1">-</span>
                                        <span className={getScoreStyle(resultat, true)}>{scoreAdversaire}</span>
                                        <span className="text-red-600 ml-2 text-sm">(FF Extérieur)</span>
                                      </div>
                                    ) : match.score === "fg-d" || match.score === "fg-e" ? (
                                      <div className="text-base font-bold text-purple-600">
                                        Forfait Général
                                      </div>
                                    ) : (
                                      <div className="text-base font-bold">
                                        <span className={getScoreStyle(resultat, false)}>{scoreEquipe}</span>
                                        <span className="text-gray-400 mx-1">-</span>
                                        <span className={getScoreStyle(resultat, true)}>{scoreAdversaire}</span>
                                      </div>
                                    )}

                                    {resultat &&
                                      match.score !== "ff-d" &&
                                      match.score !== "ff-e" &&
                                      match.score !== "fg-d" &&
                                      match.score !== "fg-e" &&
                                      match.score.toLowerCase() !== 'bye' && (
                                        <Badge className={getBadgeStyle(resultat)}>
                                          {resultat === "victoire" ? "V" : resultat === "defaite" ? "D" : "N"}
                                        </Badge>
                                      )}

                                    {match.score.toLowerCase() === 'bye' && (
                                      <Badge className="bg-blue-100 text-blue-800 ml-2">
                                        BYE
                                      </Badge>
                                    )}

                                    {(match.score === "ff-d" || match.score === "ff-e") && (
                                      <Badge
                                        className={
                                          (isDomicile && match.score === "ff-d") ||
                                          (!isDomicile && match.score === "ff-e")
                                            ? "bg-red-100 text-red-800 ml-2"
                                            : "bg-green-100 text-green-800 ml-2"
                                        }
                                      >
                                        FF
                                      </Badge>
                                    )}

                                    {(match.score === "fg-d" || match.score === "fg-e") && (
                                      <Badge className="bg-purple-100 text-purple-800 ml-2">FG</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-gray-500 italic bg-gray-100 px-3 py-1 rounded-full">
                                    À jouer
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="w-40 text-right text-gray-600 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Calendar className="h-4 w-4 text-[#F1C40F]" />
                                  <span className="font-medium">
                                    {match.date
                                      ? new Date(match.date).toLocaleDateString("fr-BE", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                      : "À définir"}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-2xl border-0 text-center">
              <CardContent className="p-12">
                <Filter className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-[#3A3A3A] mb-2">Aucun match trouvé</h3>
                <p className="text-gray-600">Aucun match ne correspond au filtre sélectionné.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
