export interface PersonalInformation {
  name: string;
  title: string;
  hero: string;
  introduction: string;
  languages: Record<string, string>;
  email: string;
  github: string;
  linkedin: string;
  website: string;
  twitter: string;
}

export interface AboutSection {
  title: string;
  paragraphs: string[];
  images?: string[];
  icons?: string[];
  link?: string;
}

export interface Experience {
  title: string;
  company: string;
  mode: string;
  startDate: string;
  endDate?: string;
  locations: string[];
  description: string[];
  responsibilities?: string[];
  skills?: string[];
}

export interface Resume {
  personalInformation: PersonalInformation;
  aboutSections: AboutSection[];
  experiences: Experience[];
}

export type Culture = "fr" | "en";
