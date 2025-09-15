/* eslint-disable */
import { useState, useEffect, useMemo } from "react"
import { Loader2, Calendar, Filter, ArrowLeft } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { fetchMatches, type TabtMatch } from "@/services/tabt"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table.tsx"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CalendrierPage() {
  const [divisionId, setDivisionId] = useState<number | null>(null)
  const [matchs, setMatchs] = useState<TabtMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtre, setFiltre] = useState<"tous" | "passes" | "futurs">("tous")
  const [error, setError] = useState<string | null>(null)

  const location = useLocation()

  // Constante club CTT Frameries
  const CLUB_ID = 'H442'

  // Helpers
  const isByeTeam = (name?: string | null) => !!(name && /^\s*(vrij|bye)\b/i.test(name))
  const displayTeam = (name?: string | null) => (isByeTeam(name || '') ? 'Bye' : (name || ''))
  // Remplacement d’affichage pour certains termes NL
  const formatDivisionName = (name: string): string => {
    if (!name) return ''
    return name
      .replace(/\bAfdeling\b/gi, 'Division')
      .replace(/\bVeteranen\b/gi, 'Vétérans')
      .replace(/\bHeren\b/gi, 'Hommes')
  }

  const parseDateTime = (m: TabtMatch): Date | null => {
    if (!m?.date) return null
    const iso = `${m.date}T${m.time || '00:00:00'}`
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const hasValidScore = (m: TabtMatch) => {
    if (m.homeWithdrawn === 'Y' || m.awayWithdrawn === 'Y') return true
    if (!m.score) return false
    const s = m.score.toLowerCase()
    if (s === 'bye') return true
    if (!s.includes('-')) return false
    const parts = s.split('-').map((x) => parseInt(x, 10))
    return parts.length === 2 && parts.every((n) => !Number.isNaN(n))
  }

  type Resultat = 'victoire' | 'defaite' | 'nul' | null
  const resultatPourFrameries = (m: TabtMatch): Resultat => {
    const frHome = m.homeClub === CLUB_ID
    const frAway = m.awayClub === CLUB_ID
    if (!frHome && !frAway) return null

    if (m.homeWithdrawn === 'Y') {
      return frHome ? 'defaite' : 'victoire'
    }
    if (m.awayWithdrawn === 'Y') {
      return frAway ? 'defaite' : 'victoire'
    }
    if (m.score && m.score.toLowerCase() !== 'bye' && m.score.includes('-')) {
      const [sd, se] = m.score.split('-').map((x) => parseInt(x, 10))
      const own = frHome ? sd : se
      const opp = frHome ? se : sd
      if (own > opp) return 'victoire'
      if (own < opp) return 'defaite'
      return 'nul'
    }
    return null
  }

  const scoreColor = (r: Resultat | null) => {
    if (r === 'victoire') return 'text-green-600'
    if (r === 'defaite') return 'text-red-600'
    if (r === 'nul') return 'text-black'
    return ''
  }

  // Lecture divisionId + chargement matches
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams(location.search)
    const divisionIdParam = params.get('divisionId')
    const parsedDivisionId = divisionIdParam ? parseInt(divisionIdParam, 10) : null

    if (!parsedDivisionId || Number.isNaN(parsedDivisionId)) {
      setDivisionId(null)
      setMatchs([])
      setIsLoading(false)
      setError('divisionId manquant dans l’URL')
      return
    }

    setDivisionId(parsedDivisionId)

    fetchMatches({ divisionId: parsedDivisionId, showDivisionName: 'yes', timeoutMs: 20000 })
      .then((resp) => {
        if (cancelled) return
        setMatchs(resp.data || [])
      })
      .catch((e) => {
        if (cancelled) return
        setError("Impossible de charger les matchs (AFTT)")
        console.error(e)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [location.search])

  const aujourdhui = useMemo(() => new Date(), [])

  // Nom de division à afficher (éviter l’ID)
  const divisionName = useMemo(() => {
    const first = (matchs || []).find(m => !!m.divisionName)
    return first?.divisionName ? formatDivisionName(first.divisionName) : null
  }, [matchs])

  const filtered = useMemo(() => {
    return (matchs || []).filter((m) => {
      if (filtre === 'tous') return true
      const d = parseDateTime(m)
      if (filtre === 'passes') return hasValidScore(m) || (!!d && d < aujourdhui)
      if (filtre === 'futurs') return !hasValidScore(m) && (!d || d >= aujourdhui)
      return true
    })
  }, [matchs, filtre, aujourdhui])

  // Tri global par semaine puis date/heure (croissant)
  const sorted = useMemo(() => {
    const getWeek = (m: TabtMatch): number => {
      const w = (m.weekName || '').toString().trim()
      const n = parseInt(w, 10)
      return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n
    }
    const arr = [...filtered]
    arr.sort((a, b) => {
      const wa = getWeek(a)
      const wb = getWeek(b)
      if (wa !== wb) return wa - wb
      const da = parseDateTime(a)
      const db = parseDateTime(b)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return da.getTime() - db.getTime()
    })
    return arr
  }, [filtered])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#F1C40F]" />
      </div>
    )
  }

  if (error) {
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
              Matches par division
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              to="/competition/equipes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3A3A3A] text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux équipes
            </Link>
          </div>

          <Card className="shadow-2xl border-0 mb-8">
            <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="bg-[#F1C40F] p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-[#3A3A3A]" />
                </div>
                {divisionName ? `Calendrier — ${divisionName}` : 'Calendrier — Division'}
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

          {/* Liste triée, centrée */}
          {sorted.length > 0 ? (
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {sorted.map((m) => {
                      const d = parseDateTime(m)
                      const dateLabel = d
                        ? d.toLocaleDateString("fr-BE", { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'À définir'
                      const timeLabel = d ? d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }) : ''

                      const res = resultatPourFrameries(m)
                      const scoreClass = scoreColor(res)

                      const scoreBlock = (() => {
                        if (m.homeWithdrawn === 'Y') return <span className={`font-semibold ${scoreClass}`}>FF domicile</span>
                        if (m.awayWithdrawn === 'Y') return <span className={`font-semibold ${scoreClass}`}>FF extérieur</span>
                        if (m.score && m.score.toLowerCase() === 'bye') return <span className="text-blue-600 font-semibold">BYE</span>
                        if (m.score) return <span className={`font-bold ${scoreClass}`}>{m.score}</span>
                        return <span className="text-sm font-medium text-gray-500 italic bg-gray-100 px-3 py-1 rounded-full">À jouer</span>
                      })()

                      return (
                        <TableRow key={(m.matchUniqueId || m.matchId || `${m.date}-${m.homeTeam}-${m.awayTeam}`) as any} className="hover:bg-gray-50/70 transition-colors duration-200">
                          <TableCell className="w-48 text-center text-gray-700">
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-semibold">{dateLabel}</span>
                              {timeLabel && <span className="text-xs text-gray-500">{timeLabel}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-[#3A3A3A]">{displayTeam(m.homeTeam)}</TableCell>
                          <TableCell className="w-32 text-center">{scoreBlock}</TableCell>
                          <TableCell className="text-center font-semibold text-[#3A3A3A]">{displayTeam(m.awayTeam)}</TableCell>
                          <TableCell className="w-16 text-center text-gray-600">{m.weekName || '—'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
