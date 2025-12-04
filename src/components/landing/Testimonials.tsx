import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const testimonials = [
  {
    quote: 'Als Webdesigner habe ich endlich eine Lösung gefunden, um Restaurants in Hamburg anzusprechen. 50 personalisierte E-Mails in 2 Tagen – und 8 Anfragen!',
    author: 'Jan Petersen',
    role: 'Webdesigner',
    target: 'Restaurants in Hamburg',
    initials: 'JP',
  },
  {
    quote: 'Ich wollte Handwerksbetriebe in München als Steuerberater gewinnen. Die E-Mails waren so gut, dass ich dachte, ich hätte sie selbst geschrieben.',
    author: 'Dr. Maria Schneider',
    role: 'Steuerberaterin',
    target: 'Handwerksbetriebe in München',
    initials: 'MS',
  },
  {
    quote: 'Hotels in Berlin für unseren Reinigungsservice zu finden war immer schwer. Mit Cold Calling hatten wir 25 Erstkontakte in einer Woche.',
    author: 'Thomas Weber',
    role: 'Geschäftsführer Reinigungsservice',
    target: 'Hotels in Berlin',
    initials: 'TW',
  },
];

export const Testimonials = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Das sagen unsere Kunden
          </h2>
          <div className="flex items-center justify-center gap-1" aria-label="5 von 5 Sternen">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" aria-hidden="true" />
            ))}
            <span className="ml-2 text-muted-foreground">4.9/5 Bewertung</span>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full border-border/50">
                  <CardContent className="flex flex-col justify-between h-full p-6">
                    <div>
                      <div className="flex gap-1 mb-4" aria-label="5 Sterne">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                        ))}
                      </div>
                      <blockquote className="text-sm text-muted-foreground italic mb-4">
                        "{testimonial.quote}"
                      </blockquote>
                      <div className="text-xs text-primary font-medium mb-4">
                        Zielgruppe: {testimonial.target}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.author}</div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};
