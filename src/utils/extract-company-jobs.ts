// jobExtractor.ts

import { VoyagerJobsApiResponse, JobListing, WorkModel, JobExtractionResult, PagingInfo } from './types';

/**
 * Creates a lookup map from the 'included' array for efficient data retrieval.
 * @param includedArray - The array of all data objects from the API response.
 * @returns A Map where the key is the entityUrn and the value is the object.
 */
function createIncludedMap(includedArray: any[]): Map<string, any> {
  return new Map(includedArray.map(item => [item.entityUrn, item]));
}

/**
 * Parses the location and work model from the secondary description string.
 * e.g., "Bethesda, MD (Hybrid)" -> { location: "Bethesda, MD", workModel: "Hybrid" }
 * @param description - The secondary description string.
 * @returns An object with location and workModel.
 */
function parseLocationAndWorkModel(description: string | undefined): { location: string; workModel: WorkModel } {
    if (!description) {
        return { location: 'Unknown', workModel: 'Unknown' };
    }
    const match = description.match(/(.*) \((.*)\)/);
    if (match && match.length === 3) {
        const location = match[1].trim();
        const model = match[2].trim();
        if (model === 'On-site' || model === 'Hybrid' || model === 'Remote') {
            return { location, workModel: model };
        }
    }
    return { location: description, workModel: 'Unknown' };
}

/**
 * Analyzes the LinkedIn Voyager jobs API response and extracts job listings along with pagination info.
 * @param apiResponse - The full JSON response from the LinkedIn jobs API.
 * @returns An object containing an array of structured JobListing objects and the paging data.
 */
export function extractCompanyJobs(apiResponse: VoyagerJobsApiResponse): JobExtractionResult {
  const includedMap = createIncludedMap(apiResponse.included);
  const jobCardElements = apiResponse.data.elements;
  
  // Extract the paging object directly from the response
  const paging: PagingInfo = {
    start: apiResponse.data.paging.start,
    count: apiResponse.data.paging.count,
    total: apiResponse.data.paging.total,
  };

  const extractedJobs: JobListing[] = [];

  for (const element of jobCardElements) {
    const jobCardUrn = element.jobCardUnion?.['*jobPostingCard'];
    if (!jobCardUrn) continue;

    const jobCardObject = includedMap.get(jobCardUrn);
    if (jobCardObject?.$type !== 'com.linkedin.voyager.dash.jobs.JobPostingCard') continue;
    
    const jobPostingUrn = jobCardObject.jobPostingUrn;
    const jobId = jobPostingUrn?.split(':').pop();
    if (!jobId) continue;

    const { location, workModel } = parseLocationAndWorkModel(jobCardObject.secondaryDescription?.text);

    const job: JobListing = {
      jobId,
      title: jobCardObject.title?.text ?? 'Unknown Title',
      companyName: jobCardObject.primaryDescription?.text ?? 'Unknown Company',
      location,
      workModel,
      jobUrl: `https://www.linkedin.com/jobs/view/${jobId}/`,
    };

    extractedJobs.push(job);
  }

  // Return the combined result
  return {
    jobListings: extractedJobs,
    paging: paging
  };
}






























// // jobExtractor.ts

// import { VoyagerJobsApiResponse, JobListing, WorkModel } from './types';

// /**
//  * Creates a lookup map from the 'included' array for efficient data retrieval.
//  * @param includedArray - The array of all data objects from the API response.
//  * @returns A Map where the key is the entityUrn and the value is the object.
//  */
// function createIncludedMap(includedArray: any[]): Map<string, any> {
//   return new Map(includedArray.map(item => [item.entityUrn, item]));
// }

// /**
//  * Parses the location and work model from the secondary description string.
//  * e.g., "Bethesda, MD (Hybrid)" -> { location: "Bethesda, MD", workModel: "Hybrid" }
//  * @param description - The secondary description string.
//  * @returns An object with location and workModel.
//  */
// function parseLocationAndWorkModel(description: string | undefined): { location: string; workModel: WorkModel } {
//     if (!description) {
//         return { location: 'Unknown', workModel: 'Unknown' };
//     }

//     // Regex to capture the location part and the part in parentheses
//     const match = description.match(/(.*) \((.*)\)/);

//     if (match && match.length === 3) {
//         const location = match[1].trim();
//         const model = match[2].trim();
        
//         // Type guard to ensure the model is one of our defined types
//         if (model === 'On-site' || model === 'Hybrid' || model === 'Remote') {
//             return { location, workModel: model };
//         }
//     }

//     // Fallback if the pattern doesn't match or the model is not recognized
//     return { location: description, workModel: 'Unknown' };
// }

// /**
//  * Analyzes the LinkedIn Voyager jobs API response and extracts job listings.
//  * @param apiResponse - The full JSON response from the LinkedIn jobs API.
//  * @returns An array of structured JobListing objects.
//  */
// export function extractCompanyJobs(apiResponse: VoyagerJobsApiResponse): JobListing[] {
//   const includedMap = createIncludedMap(apiResponse.included);
//   const jobCardElements = apiResponse.data.elements;

//   const extractedJobs: JobListing[] = [];

//   for (const element of jobCardElements) {
//     // 1. Get the URN pointer from the main elements list
//     const jobCardUrn = element.jobCardUnion?.['*jobPostingCard'];
//     if (!jobCardUrn) {
//       continue;
//     }

//     // 2. Look up the full job card object in our map
//     const jobCardObject = includedMap.get(jobCardUrn);

//     // 3. Ensure it's the correct type before processing
//     if (jobCardObject?.$type !== 'com.linkedin.voyager.dash.jobs.JobPostingCard') {
//       continue;
//     }

//     // 4. Extract the job ID from its URN
//     // e.g., "urn:li:fsd_jobPosting:4333848494" -> "4333848494"
//     const jobPostingUrn = jobCardObject.jobPostingUrn;
//     const jobId = jobPostingUrn?.split(':').pop();

//     if (!jobId) {
//         continue;
//     }

//     // 5. Parse location and work model from the secondary description
//     const { location, workModel } = parseLocationAndWorkModel(jobCardObject.secondaryDescription?.text);

//     // 6. Assemble the clean JobListing object
//     const job: JobListing = {
//       jobId,
//       title: jobCardObject.title?.text ?? 'Unknown Title',
//       companyName: jobCardObject.primaryDescription?.text ?? 'Unknown Company',
//       location,
//       workModel,
//       jobUrl: `https://www.linkedin.com/jobs/view/${jobId}/`,
//     };

//     extractedJobs.push(job);
//   }

//   return extractedJobs;
// }