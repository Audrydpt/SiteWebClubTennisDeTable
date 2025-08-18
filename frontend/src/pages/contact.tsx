/* eslint-disable jsx-a11y/label-has-associated-control,react/no-array-index-key,@typescript-eslint/no-explicit-any,no-console,no-alert,consistent-return */
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useState,
} from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import emailjs from 'emailjs-com';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { fetchInformations } from '@/services/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [infos, setInfos] = useState<any>(null); // toutes les infos depuis JSON Server

  // --- Timer pour masquer le message de succès après 5 secondes
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  // --- Charger toutes les informations depuis JSON Server
  useEffect(() => {
    const loadInfos = async () => {
      try {
        const data = await fetchInformations();
        if (data && data.length > 0) {
          setInfos(data[0]); // objet unique
        }
      } catch (err) {
        console.error('Erreur fetchInformations:', err);
      }
    };
    loadInfos();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await emailjs.send(
        'service_e24srhk',
        'template_g8dlknf',
        formData,
        'qcv3sRfxCYOFtUo0o'
      );
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Erreur EmailJS:', error);
      alert("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!infos)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#F1C40F] mx-auto mb-4" />
        </div>
      </div>
    );

  // --- Extraire les données dynamiques
  const contact = infos.contact || [];
  const texteIntro = contact[0]?.texte || '';
  const horaires = contact[0]?.horaires || [];
  const adresse = infos.adresse || '';
  const faq = contact[0]?.faq || [];
  const emailList = infos.email ? [infos.email] : [];
  const telephoneList = infos.telephone ? [infos.telephone] : [];

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
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
            Contactez le{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">CTT Frameries</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            {texteIntro}
          </p>
        </div>
      </div>

      {/* FORM + INFO */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {/* FORM */}
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
                      Nous sommes là pour répondre à toutes vos questions !
                      Remplissez le formulaire ci-dessous et nous vous
                      contacterons rapidement.
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
                      Merci pour votre message. Notre équipe vous répondra dans
                      les plus brefs délais !
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
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="border-2 border-gray-200 focus:border-[#F1C40F] focus:ring-[#F1C40F] h-12 text-lg"
                        placeholder="Sujet de votre message"
                      />
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
                        placeholder="Écrivez votre message ici..."
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

          {/* INFOS CONTACT */}
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
                {/* Emails */}
                {emailList.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                      <Mail className="h-6 w-6 text-[#3A3A3A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                        Email
                      </h3>
                      <p className="text-gray-700 font-medium">{email}</p>
                    </div>
                  </div>
                ))}

                {/* Adresse */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                    <MapPin className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                      Adresse
                    </h3>
                    <p className="text-gray-700 font-medium">{adresse}</p>
                  </div>
                </div>

                {/* Téléphones */}
                {telephoneList.map((tel, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                      <Phone className="h-6 w-6 text-[#3A3A3A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                        Téléphone
                      </h3>
                      <p className="text-gray-700 font-medium">{tel}</p>
                      {/* Ajout du texte grisé sous le téléphone */}
                      <p className="text-gray-400 font-medium mt-3">
                        <span className="font-semibold">Numéro secrétaire</span>
                      </p>
                    </div>
                  </div>
                ))}

                {/* Horaires regroupés dans une seule case */}
                {horaires.length > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                      <Clock className="h-6 w-6 text-[#3A3A3A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                        Horaires
                      </h3>
                      <ul className="text-gray-700 font-medium space-y-1">
                        {horaires.map(
                          (
                            h: {
                              jour:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<
                                    unknown,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | ReactPortal
                                    | ReactElement<
                                        unknown,
                                        string | JSXElementConstructor<any>
                                      >
                                    | Iterable<ReactNode>
                                    | null
                                    | undefined
                                  >
                                | Iterable<ReactNode>
                                | null
                                | undefined;
                              horaire:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<
                                    unknown,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | ReactPortal
                                    | ReactElement<
                                        unknown,
                                        string | JSXElementConstructor<any>
                                      >
                                    | Iterable<ReactNode>
                                    | null
                                    | undefined
                                  >
                                | Iterable<ReactNode>
                                | null
                                | undefined;
                            },
                            idx: Key | null | undefined
                          ) => (
                            <li key={idx}>
                              <span className="font-semibold">{h.jour} :</span>{' '}
                              {h.horaire}
                            </li>
                          )
                        )}
                      </ul>
                      <p className="text-gray-400 font-medium mt-3">
                        <span className="font-semibold">
                          Championnat le samedi
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              🏓 FAQ
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Questions fréquentes
            </h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              Tout ce que vous devez savoir pour rejoindre notre club de tennis
              de table
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {faq.map(
              (
                f: {
                  question:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | Iterable<ReactNode>
                    | null
                    | undefined;
                  reponse:
                    | string
                    | number
                    | bigint
                    | boolean
                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactPortal
                        | ReactElement<
                            unknown,
                            string | JSXElementConstructor<any>
                          >
                        | Iterable<ReactNode>
                        | null
                        | undefined
                      >
                    | Iterable<ReactNode>
                    | null
                    | undefined;
                },
                idx: Key | null | undefined
              ) => (
                <Card
                  key={idx}
                  className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#F1C40F] p-3 rounded-full">
                        <MessageCircle className="h-6 w-6 text-[#3A3A3A]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#3A3A3A] mb-3 text-xl">
                          {f.question}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {f.reponse}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
