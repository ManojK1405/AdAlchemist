import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Smart Upoad',
        desc: 'Simply drag and drop your files..we optimize and deliver a high-quality product that meets your needs.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Instant Generation',
        desc: 'Optimized model delivers high-quality results in seconds.'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'Video Synthesis',
        desc: 'Bring product shots to life with realistic animations.'
    }
];

export const plansData = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$12',
    desc: 'Ideal for creators and early-stage founders getting started with AI ads.',
    credits: 'One-time',
    features: [
      '25 AI ad credits',
      'Static ads only',
      'No watermark',
      'Standard resolution (1080p)',
      'Basic generation speed',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$39',
    desc: 'Perfect for startups and marketing teams creating ads regularly.',
    credits: 'Monthly',
    features: [
      '100 AI ad credits / month',
      'Static + short video ads',
      'No watermark',
      'HD resolution',
      'Faster generation speed',
      'Priority email support'
    ],
    popular: true
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: '$99',
    desc: 'Built for brands and agencies scaling ad production at speed.',
    credits: 'Monthly',
    features: [
      '300 AI ad credits / month',
      'Advanced video ads',
      'No watermark',
      '4K resolution',
      'Fastest generation speed',
      'Dedicated account support'
    ]
  }
];


export const faqData = [
  {
    question: 'What is AdAlchemist?',
    answer:
      'AdAlchemist is an AI-powered platform that generates high-quality static and video advertisements using your product and model images.'
  },
  {
    question: 'Do I need any design or video editing skills?',
    answer:
      'No. AdAlchemist handles design, composition, and animation automatically, so anyone can create professional ads in minutes.'
  },
  {
    question: 'What types of ads can I create?',
    answer:
      'You can create static image ads and short-form video ads optimized for platforms like Instagram, Facebook, and YouTube.'
  },
  {
    question: 'How do credits work?',
    answer:
      'Each ad generation uses credits based on the type and resolution of the ad. Higher-quality and video ads consume more credits.'
  },
  {
    question: 'Can I use the ads for commercial purposes?',
    answer:
      'Yes. All generated ads are royalty-free and can be used commercially without any watermark.'
  }
];


export const footerLinks = [
    {
        title: "Quick Links",
        links: [
            { name: "Home", url: "/" },
            { name: "Features", url: "/features" },
            { name: "Prices", url: "#" },
            { name: "FAQ", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];