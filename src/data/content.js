export const PERSON = {
  name: 'Gabriel',
  surname: 'De Diego',
  handle: 'dediegog',
  title: 'AI Solutions Architect',
  company: 'Universal Destinations & Experiences',
  location: 'Orlando, FL',
  linkedin: 'https://www.linkedin.com/in/dediegog/',
  initials: 'GD'
};

export const JOBS = [
  {
    id: 'xr-era',
    era: 'XR',
    title: 'XR Developer',
    company: 'Various Studios',
    period: '2016 – 2023',
    color: '#00E5FF',
    tech: ['Unity', 'Unreal Engine', 'WebXR', 'OpenXR', 'C#', 'Spatial Computing'],
    description: 'Specialized in building immersive VR/AR applications. Delivered real-time 3D experiences across enterprise, entertainment, and training.'
  },
  {
    id: 'pivot-era',
    era: 'Pivot',
    title: 'AI Software Engineer',
    company: 'Various',
    period: '2023 – April 2026',
    color: '#06B6D4',
    tech: ['Python', 'LLMs', 'AI Integration', 'Prompt Engineering', 'API Development'],
    description: 'The deliberate pivot toward AI — building intelligent software systems, integrating LLMs into production products, and developing the technical foundation for AI architecture.'
  },
  {
    id: 'ai-era',
    era: 'AI',
    title: 'AI Solutions Architect',
    company: 'Universal Destinations & Experiences',
    period: 'April 2026 – Present',
    color: '#8B5CF6',
    tech: ['LLMs', 'Prompt Engineering', 'Solutions Architecture', 'RAG', 'Python'],
    description: 'Designing AI-powered solutions for one of the world\'s largest entertainment companies. LLM integration and intelligent guest experience systems at scale.'
  }
];

export const SKILLS = [
  {
    category: 'VR / AR',
    items: ['Unity', 'Unreal Engine', 'WebXR', 'Spatial Computing', 'OpenXR', 'C#'],
    color: '#00E5FF',
    radius: 2.2,
    tiltAngle: 0.4,
    position: [-2.5, 0, 0]
  },
  {
    category: 'AI / ML',
    items: ['LLMs', 'Prompt Engineering', 'Solutions Architecture', 'RAG', 'Fine-tuning'],
    color: '#8B5CF6',
    radius: 2.0,
    tiltAngle: -0.3,
    position: [0, 0.5, -1]
  },
  {
    category: 'Software',
    items: ['JavaScript', 'Python', 'C#', 'Three.js', 'Cloud (AWS/GCP)', 'Agile'],
    color: '#A78BFA',
    radius: 2.1,
    tiltAngle: 0.2,
    position: [2.5, 0, 0]
  }
];
