export interface DemoProjectSpec {
  title: string;
  description: string;
  tags: string[];
  image: string;
}

export const demoProjects: DemoProjectSpec[] = [
  {
    title: "AI Customer Support Assistant",
    description: "Build an AI assistant that answers customer questions using RAG and tool-use.",
    tags: ["NLP", "RAG", "Agents"],
    image: "/images/projects/customer-support.jpg",
  },
  {
    title: "Churn Prediction Dashboard",
    description: "Predict churn and visualize risk cohorts with explainable features.",
    tags: ["ML", "XGBoost", "Analytics"],
    image: "/images/projects/churn-prediction.jpg",
  },
  { 
    title: "Sustainability Footprint Tracker",
    description: "Track and report product-level emissions with supplier attestations.",
    tags: ["Sustainability", "Supply Chain", "Data"], 
    image: "/images/projects/sustainability.jpg",
  },
  {
    title: "Resume Screening Copilot",
    description: "Rank candidates against job criteria and surface strengths & gaps.",
    tags: ["HR Tech", "Embeddings", "LLM"],
    image: "/images/projects/resume-screening.jpg",
  },
  {
    title: "Smart Document Q&A",
    description: "Ask questions over policy PDFs with chunking, reranking, and citations.",
    tags: ["RAG", "Citations", "Search"],
    image: "/images/projects/smart-document-qa.jpg",
  },
  {
    title: "Marketing Creative Generator",
    description: "Generate on-brand assets across channels with approval workflows.",
    tags: ["GenAI", "Brand", "Automation"],
    image: "/images/projects/marketing-creative-generator.jpg",
  },
];


// Sample project categories for companies
export const projectCategories = [
  {
    name: 'Strategy',
    description: 'AI Strategy, Product Strategy, Marketing Strategy, Sales Strategy',
    projects: 28,
    icon: '🎯'
  },
  {
    name: 'Design',
    description: 'Product Design, Web Design, Creative Design',
    projects: 24,
    icon: '🎨'
  },
  {
    name: 'Marketing',
    description: 'Content Marketing, Social Media, Digital Marketing',
    projects: 31,
    icon: '📢'
  },
  {
    name: 'Analysis',
    description: 'Data Analysis, Reporting, Research',
    projects: 19,
    icon: '📊'
  }
];

// Sample participating companies for educators
export const participatingCompanies = [
  { name: 'TechCorp', sector: 'Technology', projects: 12, categories: ['Strategy', 'Design'] },
  { name: 'FinanceINC', sector: 'Finance', projects: 8, categories: ['Analysis', 'Strategy'] },
  { name: 'HealthPlus', sector: 'Healthcare', projects: 15, categories: ['Design', 'Marketing'] },
  { name: 'RetailMax', sector: 'Retail', projects: 6, categories: ['Marketing', 'Analysis'] }
];
