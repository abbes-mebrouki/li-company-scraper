// D:/NewDev/production/node/li-company-scraper/src/utils/extract-company-info.ts

// --- TYPE DEFINITIONS for the LinkedIn API Response ---

// A generic type for any entity in the 'included' array
interface ApiEntity {
  entityUrn: string;
  $type: string;
  [key: string]: any; // Allows for other properties not explicitly defined
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  geographicArea: string; // State
  postalCode: string;
  country: string;
  headquarter?: boolean;
  description?: string | null; // This can be string | undefined from the API
}

interface Artifact {
  width: number;
  fileIdentifyingUrlPathSegment: string;
}

interface Logo {
  image: {
    rootUrl: string;
    artifacts: Artifact[];
  };
}

// CHANGED: Made the 'end' property optional to handle "10,001+" cases
interface StaffCountRange {
    start: number;
    end?: number;
}

// The main Company entity
interface Company extends ApiEntity {
  name: string;
  url: string;
  tagline?: string;
  description?: string;
  companyPageUrl?: string;
  phone?: { number: string };
  '*companyIndustries'?: string[];
  companyType?: { localizedName: string };
  foundedOn?: { year: number };
  specialities?: string[];
  '*followingInfo'?: string;
  staffCount?: number;
  staffCountRange?: StaffCountRange; // Use the updated interface
  headquarter?: Address;
  confirmedLocations?: Address[];
  logo?: Logo;
  associatedHashtags?: string[];
}

interface Industry extends ApiEntity {
  localizedName: string;
}

interface FollowingInfo extends ApiEntity {
  followerCount: number;
}

interface ContentTopicData extends ApiEntity {
  '*feedTopic': string;
}

interface FeedTopic extends ApiEntity {
  topic: {
    name: string;
  };
}

// The top-level API response structure
interface ApiResponse {
  data: {
    '*elements'?: string[];
  };
  included: ApiEntity[];
}


// --- TYPE DEFINITIONS for the final, clean CRM Data ---

// A dedicated type for our cleaned-up location objects
type CrmLocation = Address & {
  isHeadquarters: boolean;
  description: string | null; // Strictly 'string' or 'null'
};

// The final data structure for our CRM
export interface CrmData {
  linkedinUrn: string;
  linkedinUrl: string;
  name: string | null;
  tagline: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  industry: string | null;
  allIndustries: string[];
  companyType: string | null;
  foundedYear: number | null;
  specialties: string[];
  followerCount: number | null;
  employeeCount: number | null;
  employeeCountRange: string | null;
  headquarters: CrmLocation | null;
  locations: CrmLocation[];
  logoUrl: string | null;
  associatedHashtags: string[];
}


/**
 * Analyzes the LinkedIn Voyager API response and extracts company information for CRM enrichment.
 * This function is designed to be robust by using the '$type' property to identify data
 * objects, rather than relying on their order in the 'included' array.
 *
 * @param {ApiResponse} apiResponse The full JSON response from the LinkedIn Voyager API.
 * @returns {CrmData | null} A structured object with extracted company data, or null if essential data is missing.
 */
export function extractCompanyData(apiResponse: ApiResponse): CrmData | null {
  if (!apiResponse || !apiResponse.included || !Array.isArray(apiResponse.included)) {
    console.error("Invalid API response structure: 'included' array is missing.");
    return null;
  }
  
  // CHANGED: Get the target company's URN from the 'data' block. This is the correct way.
  const targetCompanyUrn = apiResponse.data?.['*elements']?.[0];
  if (!targetCompanyUrn) {
      console.error("Invalid API response structure: Target company URN is missing in 'data.*elements'.");
      return null;
  }

  // Create a Map for efficient lookups of included items by their URN.
  const includedMap = new Map<string, ApiEntity>(
    apiResponse.included.map((item: ApiEntity) => [item.entityUrn, item])
  );

  // CHANGED: Directly get the correct company object from the map using the target URN.
  const companyObject = includedMap.get(targetCompanyUrn) as Company | undefined;

  if (!companyObject || companyObject.$type !== "com.linkedin.voyager.organization.Company") {
    console.error(`Could not find the main company object with URN '${targetCompanyUrn}' in the response.`);
    return null;
  }

  // --- Industry Information ---
  const companyIndustryUrns = companyObject['*companyIndustries'] || [];
  const industries = companyIndustryUrns
    .map((urn: string) => {
      const industryObject = includedMap.get(urn) as Industry | undefined;
      return industryObject ? industryObject.localizedName : null;
    })
    .filter((name): name is string => !!name);

  // --- Follower Count ---
  const followingInfoUrn = companyObject['*followingInfo'];
  const followingInfoObject = followingInfoUrn ? includedMap.get(followingInfoUrn) as FollowingInfo | undefined : null;
  const followerCount = followingInfoObject ? followingInfoObject.followerCount : null;

  // --- Associated Hashtags ---
  const associatedHashtagUrns = companyObject.associatedHashtags || [];
  const associatedHashtags = associatedHashtagUrns
    .map((contentTopicUrn: string) => {
      const contentTopicObject = includedMap.get(contentTopicUrn) as ContentTopicData | undefined;
      if (!contentTopicObject) return null;
      
      const feedTopicUrn = contentTopicObject['*feedTopic'];
      const feedTopicObject = feedTopicUrn ? includedMap.get(feedTopicUrn) as FeedTopic | undefined : null;
      
      return feedTopicObject ? feedTopicObject.topic?.name : null;
    })
    .filter((name): name is string => !!name);

  // --- Locations ---
  const headquarter: CrmLocation | null = companyObject.headquarter ? {
      ...companyObject.headquarter,
      isHeadquarters: true,
      description: companyObject.headquarter.description || null
  } : null;
  
  const otherLocations: CrmLocation[] = (companyObject.confirmedLocations || [])
    .filter((loc: Address) => !loc.headquarter)
    .map((loc: Address): CrmLocation => ({
        ...loc,
        isHeadquarters: false,
        description: loc.description || null
    }));
  
  const allLocations: CrmLocation[] = headquarter ? [headquarter, ...otherLocations] : otherLocations;

  // --- Logo URL ---
  let logoUrl = null;
  if (companyObject.logo?.image?.artifacts) {
    const largestArtifact = companyObject.logo.image.artifacts.reduce(
        (prev: Artifact, current: Artifact) => (prev.width > current.width) ? prev : current
    );
    logoUrl = companyObject.logo.image.rootUrl + largestArtifact.fileIdentifyingUrlPathSegment;
  }

  // CHANGED: More robust logic for handling employee count range.
  let employeeCountRangeString: string | null = null;
  if (companyObject.staffCountRange) {
      const { start, end } = companyObject.staffCountRange;
      if (end) {
          employeeCountRangeString = `${start}-${end}`;
      } else {
          employeeCountRangeString = `${start}+`;
      }
  }
  
  // Assemble the final CRM object.
  const crmData: CrmData = {
    linkedinUrn: companyObject.entityUrn,
    linkedinUrl: companyObject.url,
    name: companyObject.name || null,
    tagline: companyObject.tagline || null,
    description: companyObject.description || null,
    website: companyObject.companyPageUrl || null,
    phone: companyObject.phone?.number || null,
    industry: industries.length > 0 ? industries[0] : null,
    allIndustries: industries,
    companyType: companyObject.companyType?.localizedName || null,
    foundedYear: companyObject.foundedOn?.year || null,
    specialties: companyObject.specialities || [],
    followerCount: followerCount,
    employeeCount: companyObject.staffCount || null,
    employeeCountRange: employeeCountRangeString, // Use the new robust variable
    headquarters: headquarter,
    locations: allLocations,
    logoUrl: logoUrl,
    associatedHashtags: associatedHashtags
  };

  return crmData;
}