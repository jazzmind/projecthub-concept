// Fake company data for project demonstrations
export interface FakeCompany {
  id: string;
  name: string;
  website: string;
  description: string;
  location: string;
  country: string;
  industry: string;
  size: string;
}

export const fakeCompanies: FakeCompany[] = [
  // UK Companies
  {
    id: 'tesco-plc',
    name: 'Tesco PLC',
    website: 'https://www.tesco.com',
    description: 'UK\'s largest supermarket chain providing groceries, clothing, and financial services to millions of customers worldwide.',
    location: 'Welwyn Garden City, UK',
    country: 'United Kingdom',
    industry: 'Retail',
    size: '500,000+ employees'
  },
  {
    id: 'bbc',
    name: 'BBC',
    website: 'https://www.bbc.co.uk',
    description: 'The world\'s oldest national broadcasting organisation, providing news, entertainment, and educational content globally.',
    location: 'London, UK',
    country: 'United Kingdom',
    industry: 'Media & Broadcasting',
    size: '20,000+ employees'
  },
  {
    id: 'rolls-royce',
    name: 'Rolls-Royce Holdings',
    website: 'https://www.rolls-royce.com',
    description: 'Leading industrial technology company providing power systems for aviation, defence, and energy applications.',
    location: 'Derby, UK',
    country: 'United Kingdom',
    industry: 'Aerospace & Engineering',
    size: '50,000+ employees'
  },
  {
    id: 'bt-group',
    name: 'BT Group',
    website: 'https://www.bt.com',
    description: 'Britain\'s leading telecommunications and network infrastructure provider, connecting people and businesses across the UK.',
    location: 'London, UK',
    country: 'United Kingdom',
    industry: 'Telecommunications',
    size: '100,000+ employees'
  },
  {
    id: 'nhs',
    name: 'NHS England',
    website: 'https://www.england.nhs.uk',
    description: 'The National Health Service providing free healthcare to all UK residents through innovative medical services and technologies.',
    location: 'Leeds, UK',
    country: 'United Kingdom',
    industry: 'Healthcare',
    size: '1,500,000+ employees'
  },
  {
    id: 'lloyds-banking',
    name: 'Lloyds Banking Group',
    website: 'https://www.lloydsbankinggroup.com',
    description: 'One of the UK\'s largest financial services groups, helping Britain prosper through banking, insurance, and investment services.',
    location: 'Edinburgh, UK',
    country: 'United Kingdom',
    industry: 'Financial Services',
    size: '65,000+ employees'
  },
  {
    id: 'arm-holdings',
    name: 'Arm Holdings',
    website: 'https://www.arm.com',
    description: 'World-leading semiconductor and software design company powering the technology that transforms how people live and work.',
    location: 'Cambridge, UK',
    country: 'United Kingdom',
    industry: 'Technology',
    size: '7,000+ employees'
  },
  {
    id: 'virgin-group',
    name: 'Virgin Group',
    website: 'https://www.virgin.com',
    description: 'Entrepreneurial business group focused on making a positive difference, operating across travel, health, space, and entertainment.',
    location: 'London, UK',
    country: 'United Kingdom',
    industry: 'Conglomerate',
    size: '70,000+ employees'
  },
  {
    id: 'university-oxford',
    name: 'University of Oxford',
    website: 'https://www.ox.ac.uk',
    description: 'World-renowned research university committed to excellence in education, learning, and research across all disciplines.',
    location: 'Oxford, UK',
    country: 'United Kingdom',
    industry: 'Education',
    size: '12,000+ employees'
  },
  {
    id: 'greenpeace-uk',
    name: 'Greenpeace UK',
    website: 'https://www.greenpeace.org.uk',
    description: 'Independent environmental organisation campaigning for a green and peaceful world through non-violent direct action.',
    location: 'London, UK',
    country: 'United Kingdom',
    industry: 'Non-Profit',
    size: '150+ employees'
  },

  // Global Companies
  {
    id: 'microsoft',
    name: 'Microsoft Corporation',
    website: 'https://www.microsoft.com',
    description: 'Global technology leader empowering every person and organisation on the planet to achieve more through innovative software and cloud services.',
    location: 'Redmond, WA, USA',
    country: 'United States',
    industry: 'Technology',
    size: '220,000+ employees'
  },
  {
    id: 'google',
    name: 'Google LLC',
    website: 'https://www.google.com',
    description: 'Multinational technology company specializing in Internet-related services including search, cloud computing, and artificial intelligence.',
    location: 'Mountain View, CA, USA',
    country: 'United States',
    industry: 'Technology',
    size: '150,000+ employees'
  },
  {
    id: 'amazon',
    name: 'Amazon.com Inc.',
    website: 'https://www.amazon.com',
    description: 'Global e-commerce and cloud computing giant focused on customer obsession, innovation, and long-term thinking.',
    location: 'Seattle, WA, USA',
    country: 'United States',
    industry: 'E-commerce & Cloud',
    size: '1,500,000+ employees'
  },
  {
    id: 'tesla',
    name: 'Tesla Inc.',
    website: 'https://www.tesla.com',
    description: 'Pioneering sustainable transport and energy company accelerating the world\'s transition to renewable energy.',
    location: 'Austin, TX, USA',
    country: 'United States',
    industry: 'Automotive & Energy',
    size: '130,000+ employees'
  },
  {
    id: 'unilever',
    name: 'Unilever PLC',
    website: 'https://www.unilever.com',
    description: 'Multinational consumer goods company making sustainable living commonplace through trusted brands that improve wellbeing.',
    location: 'London, UK / Rotterdam, NL',
    country: 'United Kingdom / Netherlands',
    industry: 'Consumer Goods',
    size: '190,000+ employees'
  },
  {
    id: 'spotify',
    name: 'Spotify Technology',
    website: 'https://www.spotify.com',
    description: 'World\'s most popular audio streaming platform giving millions of people access to music and podcasts instantly.',
    location: 'Stockholm, Sweden',
    country: 'Sweden',
    industry: 'Media & Entertainment',
    size: '9,000+ employees'
  },
  {
    id: 'nestle',
    name: 'Nestlé S.A.',
    website: 'https://www.nestle.com',
    description: 'World\'s largest food and beverage company committed to enhancing quality of life and contributing to a healthier future.',
    location: 'Vevey, Switzerland',
    country: 'Switzerland',
    industry: 'Food & Beverage',
    size: '270,000+ employees'
  },
  {
    id: 'ikea',
    name: 'IKEA Group',
    website: 'https://www.ikea.com',
    description: 'Swedish furniture retailer offering well-designed, functional home furnishing products at affordable prices for the many people.',
    location: 'Älmhult, Sweden',
    country: 'Sweden',
    industry: 'Retail & Furniture',
    size: '200,000+ employees'
  },
  {
    id: 'doctors-without-borders',
    name: 'Médecins Sans Frontières',
    website: 'https://www.msf.org',
    description: 'International humanitarian medical organisation providing emergency aid to people affected by conflict, epidemics, and disasters.',
    location: 'Geneva, Switzerland',
    country: 'Switzerland',
    industry: 'Non-Profit Healthcare',
    size: '45,000+ volunteers'
  },
  {
    id: 'world-wildlife-fund',
    name: 'World Wildlife Fund',
    website: 'https://www.worldwildlife.org',
    description: 'Leading conservation organisation working to conserve nature and reduce the most pressing threats to our planet\'s biodiversity.',
    location: 'Gland, Switzerland',
    country: 'Switzerland',
    industry: 'Environmental Conservation',
    size: '6,000+ employees'
  },
  {
    id: 'deloitte',
    name: 'Deloitte Touche Tohmatsu',
    website: 'https://www.deloitte.com',
    description: 'Global professional services network providing audit, consulting, financial advisory, and tax services to multinational corporations.',
    location: 'London, UK',
    country: 'United Kingdom',
    industry: 'Professional Services',
    size: '400,000+ employees'
  },
  {
    id: 'mckinsey',
    name: 'McKinsey & Company',
    website: 'https://www.mckinsey.com',
    description: 'Global management consulting firm helping organisations create positive, enduring change through strategic advisory services.',
    location: 'New York, NY, USA',
    country: 'United States',
    industry: 'Management Consulting',
    size: '35,000+ employees'
  }
];

// Helper function to get a random company for a project
export const getRandomCompany = (projectId: string): FakeCompany => {
  // Use project ID as seed to ensure consistent assignment
  const hash = projectId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % fakeCompanies.length;
  return fakeCompanies[index];
};

// Helper function to get company by industry (for better matching)
export const getCompanyByIndustry = (projectId: string, industry: string): FakeCompany => {
  // Try to match industry first
  const industryMatches = fakeCompanies.filter(company => {
    const companyIndustry = company.industry.toLowerCase();
    const projectIndustry = industry.toLowerCase();
    
    return companyIndustry.includes(projectIndustry) || 
           projectIndustry.includes(companyIndustry) ||
           (projectIndustry.includes('health') && companyIndustry.includes('health')) ||
           (projectIndustry.includes('tech') && companyIndustry.includes('tech')) ||
           (projectIndustry.includes('finance') && companyIndustry.includes('financial')) ||
           (projectIndustry.includes('retail') && companyIndustry.includes('retail')) ||
           (projectIndustry.includes('media') && companyIndustry.includes('media')) ||
           (projectIndustry.includes('education') && companyIndustry.includes('education')) ||
           (projectIndustry.includes('non-profit') && companyIndustry.includes('non-profit'));
  });
  
  if (industryMatches.length > 0) {
    // Use project ID as seed for consistent selection within industry matches
    const hash = projectId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const index = Math.abs(hash) % industryMatches.length;
    return industryMatches[index];
  }
  
  // Fallback to random company
  return getRandomCompany(projectId);
};
