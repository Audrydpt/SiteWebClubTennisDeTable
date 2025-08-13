/* eslint-disable */
'use client';

import type React from 'react';

import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Users,
  Trophy,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Correction pour le select
  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
        {/* Ping pong themed background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Contactez le CTT Frameries
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            Une question sur nos entraînements, nos compétitions ou souhaitez-vous rejoindre notre club ? N'hésitez pas à contacter le comité du CTT Frameries.
          </p>

          <div className="flex justify-center gap-12 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F1C40F]">50+</div>
              <div className="text-sm text-gray-300">Membres actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F1C40F]">15</div>
              <div className="text-sm text-gray-300">
                Années d&#39;expérience
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#F1C40F]">6</div>
              <div className="text-sm text-gray-300">Tables disponibles</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#F1C40F] via-yellow-400 to-[#F1C40F] text-[#3A3A3A] p-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Send className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      Envoyez-nous un message
                    </CardTitle>
                    <CardDescription className="text-[#3A3A3A]/80 text-lg mt-2">
                      Que ce soit pour une inscription, des infos ou juste pour dire bonjour !
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-[#3A3A3A] mb-4">
                      Message envoyé avec succès !
                    </h3>
                    <p className="text-gray-600 text-lg">
                      Merci pour votre message. Notre équipe vous répondra
                      rapidement pour vous accueillir au club !
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="block text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide"
                        >
                          Nom complet *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="border-2 border-gray-200 focus:border-[#F1C40F] focus:ring-[#F1C40F] h-12 text-lg"
                          placeholder="Votre nom complet"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide"
                        >
                          Email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="border-2 border-gray-200 focus:border-[#F1C40F] focus:ring-[#F1C40F] h-12 text-lg"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide"
                      >
                        Sujet *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleSelectChange}
                        className="w-full border-2 border-gray-200 focus:border-[#F1C40F] focus:ring-[#F1C40F] h-12 text-lg rounded-md px-3"
                      >
                        <option value="">Choisissez un sujet</option>
                        <option value="inscription">Inscription au club</option>
                        <option value="entrainements">
                          Informations sur les entraînements
                        </option>
                        <option value="competitions">
                          Compétitions et tournois
                        </option>
                        <option value="tarifs">Tarifs et cotisations</option>
                        <option value="materiel">Matériel et équipement</option>
                        <option value="autre">Autre demande</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-[#3A3A3A] uppercase tracking-wide"
                      >
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="border-2 border-gray-200 focus:border-[#F1C40F] focus:ring-[#F1C40F] resize-none text-lg"
                        placeholder="Parlez-nous de votre niveau, vos attentes ou toute autre question..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#3A3A3A] hover:bg-gray-800 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="h-6 w-6 mr-3" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-[#3A3A3A] text-white p-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-[#F1C40F]" />
                  Nos coordonnées
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Venez nous rendre visite !
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                    <Mail className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                      Email
                    </h3>
                    <p className="text-gray-700 font-medium">
                      contact@cttframeries.be
                    </p>
                    <p className="text-gray-600">secretaire@cttframeries.be</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                    <Phone className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                      Téléphone
                    </h3>
                    <p className="text-gray-700 font-medium">+32 65 XX XX XX</p>
                    <p className="text-gray-600 text-sm">Président du club</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                    <MapPin className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                      Salle de sport
                    </h3>
                    <p className="text-gray-700 font-medium">
                      Complexe Sportif de Frameries
                      <br />
                      Rue du Sport 15
                      <br />
                      7080 Frameries
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                    <Clock className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                      Entraînements
                    </h3>
                    <p className="text-gray-700">
                      <span className="font-medium">Mardi :</span> 19h00 - 22h00
                      <br />
                      <span className="font-medium">Jeudi :</span> 19h00 - 22h00
                      <br />
                      <span className="font-medium">Samedi :</span> 14h00 - 18h00
                      <br />
                      <span className="text-sm text-gray-600">
                        Compétitions le dimanche
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              🏓 FAQ
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Questions fréquentes
            </h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              Tout ce que vous devez savoir pour rejoindre notre club de tennis de table
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F1C40F] p-3 rounded-full">
                    <Users className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-3 text-xl">
                      Comment s'inscrire ?
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Contactez-nous par email ou venez directement lors d'un entraînement. Séance d'essai gratuite pour tous les nouveaux membres !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F1C40F] p-3 rounded-full">
                    <Trophy className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-3 text-xl">
                      Quel niveau requis ?
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Tous les niveaux sont les bienvenus ! Du débutant complet au joueur confirmé, nous avons des groupes adaptés à chacun.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F1C40F] p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-3 text-xl">
                      Matériel nécessaire ?
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Pour débuter, des chaussures de sport suffisent. Le club prête raquettes et balles. Conseils d'achat pour votre propre matériel disponibles.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F1C40F] p-3 rounded-full">
                    <Clock className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-3 text-xl">
                      Tarifs et cotisations
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Cotisation annuelle très abordable. Tarifs dégressifs pour les familles et étudiants. Contactez-nous pour plus de détails !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
