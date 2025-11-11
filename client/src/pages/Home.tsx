import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: "Gestion d'événements",
      description: "Créez et gérez vos événements d'entreprise en quelques clics avec QR codes automatiques"
    },
    {
      icon: Users,
      title: "Covoiturage intelligent",
      description: "Optimisez les trajets de vos participants grâce à notre algorithme de matching par localisation"
    },
    {
      icon: MapPin,
      title: "Géolocalisation précise",
      description: "Suggestions d'adresses automatiques avec l'API française adresse.data.gouv.fr"
    },
    {
      icon: TrendingUp,
      title: "Analytics en temps réel",
      description: "Suivez la participation, les économies CO2 et les statistiques de vos événements"
    },
    {
      icon: Shield,
      title: "Sécurité entreprise",
      description: "Authentification JWT, validation SIREN, et conformité RGPD garanties"
    },
    {
      icon: Zap,
      title: "Paiements automatisés",
      description: "Intégration Stripe avec facturation PDF automatique et gestion d'abonnements"
    }
  ];

  const plans = [
    {
      tier: "DÉCOUVERTE",
      price: "Gratuit",
      description: "Idéal pour tester la plateforme",
      features: [
        "Jusqu'à 5 événements/mois",
        "50 participants max par événement",
        "QR codes automatiques",
        "Support email"
      ],
      cta: "Commencer gratuitement",
      highlighted: false,
      badge: null
    },
    {
      tier: "ESSENTIEL",
      price: "49€",
      period: "/mois",
      description: "Pour les PME actives",
      features: [
        "20 événements/mois",
        "200 participants max par événement",
        "Covoiturage intelligent",
        "Analytics basiques",
        "Support prioritaire"
      ],
      cta: "Essayer 14 jours gratuits",
      highlighted: true,
      badge: "Populaire"
    },
    {
      tier: "PRO",
      price: "Sur devis",
      description: "Pour les grandes entreprises",
      features: [
        "Événements illimités",
        "1000 participants max par événement",
        "API d'intégration",
        "Analytics avancées",
        "Support dédié 24/7",
        "Formation incluse"
      ],
      cta: "Demander un devis",
      highlighted: false,
      badge: null
    },
    {
      tier: "PREMIUM",
      price: "Sur devis",
      description: "Solution sur-mesure",
      features: [
        "Tout du plan Pro",
        "Infrastructure dédiée",
        "Personnalisation complète",
        "SLA garantie 99.9%",
        "Account manager dédié",
        "Audit de sécurité"
      ],
      cta: "Contactez-nous",
      highlighted: false,
      badge: "Enterprise"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">TM</span>
            </div>
            <span className="text-xl font-semibold">TEAMMOVE</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">Tarifs</a>
            <Link href="/login">
              <a className="text-sm hover:text-primary transition-colors">Connexion</a>
            </Link>
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" data-testid="button-login">
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="button-register">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="w-fit">
                SaaS événementiel #1 en France
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Organisez vos événements d'entreprise avec intelligence
              </h1>
              <p className="text-xl text-muted-foreground">
                TEAMMOVE combine gestion d'événements et covoiturage intelligent pour réduire vos coûts et votre empreinte carbone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-demo">
                  Voir la démo
                </Button>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-muted-foreground">Entreprises</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm text-muted-foreground">Événements</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">2M+</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Calendar className="h-32 w-32 text-primary mx-auto" />
                  <p className="text-2xl font-semibold">Dashboard Preview</p>
                  <p className="text-muted-foreground max-w-sm">
                    Interface intuitive pour gérer tous vos événements en un coup d'œil
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour simplifier l'organisation de vos événements professionnels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover-elevate" data-testid={`card-feature-${idx}`}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Tarifs transparents</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choisissez le plan adapté à la taille de votre entreprise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative hover-elevate ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}
                data-testid={`card-plan-${plan.tier.toLowerCase()}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {plan.tier}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? "default" : "outline"}
                      data-testid={`button-plan-${plan.tier.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl font-bold">Prêt à transformer vos événements ?</h2>
          <p className="text-xl opacity-90">
            Rejoignez des centaines d'entreprises qui optimisent leurs événements avec TEAMMOVE
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" data-testid="button-cta-register">
                Créer un compte gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-admin">
                Espace administrateur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">TM</span>
                </div>
                <span className="font-semibold">TEAMMOVE</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La plateforme SaaS de gestion d'événements avec covoiturage intelligent
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 TEAMMOVE. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
