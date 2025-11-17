
export enum MediaType {
  IMAGE = 'Image',
  VIDEO = 'Video',
  RESHARE = 'Reshare',
  TEXT = 'Text',
  PROMO = 'Promo',
  UNKNOWN = 'Unknown',
}

export interface SocialCounts {
  likes: number
  comments: number
  shares: number
}

export interface CompanyPost {
  urn: string
  postUrl?: string
  authorName: string
  postedAt: string
  postText: string
  mediaType: MediaType
  socialCounts: SocialCounts
  hashtags: string[]
  mentionedCompanies: { name: string; url: string }[]
}


export interface PostsPagingInfo {
  start: number
  count: number
  total: number
  paginationToken?: string
}


export interface PostExtractionResult {
  posts: CompanyPost[]
  paging: PostsPagingInfo
}


export interface VoyagerApiResponse {
  data: {
    data: {
      feedDashOrganizationalPageUpdatesByOrganizationalPageRelevanceFeed: {
        metadata: {
          paginationToken?: string
        }
        paging: {
          start: number
          count: number
          total: number
        }
        '*elements': string[]
      }
    }
  }
  included: any[]
}

// =============================== Company Jobs ===============


export type WorkModel = 'On-site' | 'Hybrid' | 'Remote' | 'Unknown'

export interface JobListing {
  jobId: string
  title: string
  companyName: string
  location: string
  workModel: WorkModel
  jobUrl: string
}


export interface PagingInfo {
  start: number
  count: number
  total: number
}


export interface JobExtractionResult {
  jobListings: JobListing[]
  paging: PagingInfo
}


export interface VoyagerJobsApiResponse {
  data: {
    elements: {
      jobCardUnion?: {
        '*jobPostingCard'?: string
      }
    }[]
    paging: PagingInfo
  }
  included: any[]
}




// ================ Company People =====================================



export interface CompanyEmployee {
  urn: string
  fullName: string
  headline: string
  location: string
  profileUrl: string
  profilePictureUrl?: string
  connectionDegree?: string
}

export interface PagingInfo {
  start: number
  count: number
  total: number
}

export interface EmployeeExtractionResult {
  employees: CompanyEmployee[]
  paging: PagingInfo
}


export interface VoyagerPeopleApiResponse {
  data: {
    data: {
      searchDashClustersByAll: {
        elements: {
          items: {
            item: {
              '*entityResult': string
            }
          }[]
        }[]
        paging: PagingInfo
      }
    }
  }
  included: any[]
}