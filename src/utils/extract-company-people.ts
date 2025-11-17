// employeeExtractor.ts

import { VoyagerPeopleApiResponse, CompanyEmployee, EmployeeExtractionResult, PagingInfo } from './types';

function createIncludedMap(includedArray: any[]): Map<string, any> {
  return new Map(includedArray.map(item => [item.entityUrn, item]));
}

/**
 * Finds the best available image URL from the profile picture artifacts.
 * Prefers a reasonably sized image like 200x200 or 100x100.
 * @param imageObject - The image object from the EntityResultViewModel.
 * @returns A URL string or undefined.
 */
function getProfilePictureUrl(imageObject: any): string | undefined {
    const nonEntityProfilePic = imageObject?.attributes?.find(
        (attr: any) => attr.detailData?.nonEntityProfilePicture
    )?.detailData.nonEntityProfilePicture;

    if (!nonEntityProfilePic?.vectorImage?.artifacts) {
        return undefined;
    }

    const artifacts = nonEntityProfilePic.vectorImage.artifacts;
    // Prefer 200x200, then 100x100, then the first available
    const preferredSizes = [200, 100];
    for (const size of preferredSizes) {
        const artifact = artifacts.find((a: any) => a.width === size);
        if (artifact?.fileIdentifyingUrlPathSegment) {
            return artifact.fileIdentifyingUrlPathSegment.startsWith('https://')
                ? artifact.fileIdentifyingUrlPathSegment
                : `${nonEntityProfilePic.vectorImage.rootUrl}${artifact.fileIdentifyingUrlPathSegment}`;
        }
    }
    
    // Fallback to the first artifact if preferred sizes are not found
    if (artifacts.length > 0 && artifacts[0].fileIdentifyingUrlPathSegment) {
        const artifact = artifacts[0];
        return artifact.fileIdentifyingUrlPathSegment.startsWith('https://')
            ? artifact.fileIdentifyingUrlPathSegment
            : `${nonEntityProfilePic.vectorImage.rootUrl}${artifact.fileIdentifyingUrlPathSegment}`;
    }

    return undefined;
}


/**
 * Analyzes the LinkedIn Voyager API response for company employees and extracts key information.
 * @param apiResponse - The full JSON response from the people search API.
 * @returns An object containing an array of employees and pagination info.
 */
export function extractCompanyEmployees(apiResponse: VoyagerPeopleApiResponse): EmployeeExtractionResult {
  const includedMap = createIncludedMap(apiResponse.included);
  const searchResults = apiResponse.data.data.searchDashClustersByAll;
  
  // The results are nested inside elements -> items
  const resultItems = searchResults.elements[0]?.items ?? [];

  const paging: PagingInfo = {
    start: searchResults.paging.start,
    count: searchResults.paging.count,
    total: searchResults.paging.total,
  };

  const extractedEmployees: CompanyEmployee[] = [];

  for (const item of resultItems) {
    const entityResultUrn = item.item['*entityResult'];
    if (!entityResultUrn) continue;

    const entityResult = includedMap.get(entityResultUrn);
    if (entityResult?.$type !== 'com.linkedin.voyager.dash.search.EntityResultViewModel') continue;

    // Some profiles are private ("LinkedIn Member") - we'll skip these.
    if (!entityResult.navigationUrl) continue;
    
    // The profile URN is nested inside the entity URN
    // urn:li:fsd_entityResultViewModel:(urn:li:fsd_profile:ACoAJXqv5FoBfML1jK4Oz_B8ansAK0W8AhjR_3Q,SEARCH_SRP,DEFAULT)
    const profileUrnMatch = entityResult.entityUrn.match(/\(urn:li:fsd_profile:[^,)]+/);
    const profileUrn = profileUrnMatch ? profileUrnMatch[0].substring(1) : 'Unknown';


    const employee: CompanyEmployee = {
      urn: profileUrn,
      fullName: entityResult.title?.text ?? 'Unknown Name',
      headline: entityResult.primarySubtitle?.text ?? '',
      location: entityResult.secondarySubtitle?.text ?? 'Unknown Location',
      profileUrl: entityResult.navigationUrl,
      profilePictureUrl: getProfilePictureUrl(entityResult.image),
      connectionDegree: entityResult.badgeText?.text?.replace('•', '').trim()
    };
    
    extractedEmployees.push(employee);
  }

  return {
    employees: extractedEmployees,
    paging,
  };
}