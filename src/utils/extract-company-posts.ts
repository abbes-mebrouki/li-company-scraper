
// extractor.ts

import { VoyagerApiResponse, CompanyPost, SocialCounts, MediaType, PostExtractionResult, PostsPagingInfo } from './types';

/**
 * Creates a lookup map from the 'included' array for efficient data retrieval.
 * @param includedArray - The array of all data objects from the API response.
 * @returns A Map where the key is the entityUrn and the value is the object.
 */
function createIncludedMap(includedArray: any[]): Map<string, any> {
  return new Map(includedArray.map(item => [item.entityUrn, item]));
}

/**
 * Extracts hashtags from a post's commentary component.
 * @param commentaryComponent - The commentary object from the included map.
 * @param includedMap - The lookup map of all included data.
 * @returns An array of hashtag strings.
 */
function getHashtags(commentaryComponent: any, includedMap: Map<string, any>): string[] {
  if (!commentaryComponent?.text?.attributesV2) {
    return [];
  }

  const hashtags: string[] = [];
  for (const attribute of commentaryComponent.text.attributesV2) {
    const hashtagUrn = attribute.detailData?.['*hashtag'];
    if (hashtagUrn) {
      const hashtagObject = includedMap.get(hashtagUrn);
      if (hashtagObject?.$type === 'com.linkedin.voyager.dash.feed.Hashtag' && hashtagObject.trackingUrn) {
        const hashtagText = hashtagObject.trackingUrn.split(':').pop();
        if (hashtagText) {
          hashtags.push(hashtagText);
        }
      }
    }
  }
  return hashtags;
}

/**
 * Extracts mentioned companies from a post's commentary component.
 * @param commentaryComponent - The commentary object from the included map.
 * @param includedMap - The lookup map of all included data.
 * @returns An array of mentioned company objects.
 */
function getMentionedCompanies(commentaryComponent: any, includedMap: Map<string, any>): { name: string; url: string }[] {
    if (!commentaryComponent?.text?.attributesV2) {
        return [];
    }

    const companies: { name: string; url: string }[] = [];
    for (const attribute of commentaryComponent.text.attributesV2) {
        const companyUrn = attribute.detailData?.['*companyName'];
        if (companyUrn) {
            const companyObject = includedMap.get(companyUrn);
            if (companyObject?.$type === 'com.linkedin.voyager.dash.organization.Company') {
                companies.push({
                    name: companyObject.name,
                    url: companyObject.url,
                });
            }
        }
    }
    return companies;
}

/**
 * Determines the type of media in a post.
 * @param updateObject - The main post update object.
 * @returns The MediaType enum value.
 */
function getMediaType(updateObject: any): MediaType {
  if (updateObject.$type === 'com.linkedin.voyager.dash.feed.Update' && updateObject.content?.promoComponent) {
      return MediaType.PROMO;
  }
  if (updateObject['*resharedUpdate']) {
    return MediaType.RESHARE;
  }
  if (updateObject.content?.linkedInVideoComponent) {
    return MediaType.VIDEO;
  }
  if (updateObject.content?.imageComponent) {
    return MediaType.IMAGE;
  }
  if (updateObject.commentary?.text?.text) {
      return MediaType.TEXT;
  }
  return MediaType.UNKNOWN;
}

/**
 * Analyzes the LinkedIn Voyager API response and extracts key information from company posts.
 * @param apiResponse - The full JSON response from the LinkedIn API.
 * @returns An object containing an array of posts and the pagination data.
 */
export function extractCompanyPosts(apiResponse: VoyagerApiResponse): PostExtractionResult {
  const includedMap = createIncludedMap(apiResponse.included);
  const postsFeed = apiResponse.data.data.feedDashOrganizationalPageUpdatesByOrganizationalPageRelevanceFeed;
  
  const postUrns = postsFeed['*elements'];
  
  // Extract the paging object directly from the response
  const paging: PostsPagingInfo = {
      start: postsFeed.paging.start,
      count: postsFeed.paging.count,
      total: postsFeed.paging.total,
      paginationToken: postsFeed.metadata.paginationToken,
  };

  const extractedPosts: CompanyPost[] = [];

  for (const postUrn of postUrns) {
    const updateObject = includedMap.get(postUrn);

    if (updateObject?.$type !== 'com.linkedin.voyager.dash.feed.Update') continue;
    if (getMediaType(updateObject) === MediaType.PROMO) continue;

    const actor = updateObject.actor;
    const commentary = updateObject.commentary;

    let socialCounts: SocialCounts = { likes: 0, comments: 0, shares: 0 };
    const socialDetailUrn = updateObject['*socialDetail'];
    if (socialDetailUrn) {
      const socialDetail = includedMap.get(socialDetailUrn);
      const socialCountsUrn = socialDetail?.['*totalSocialActivityCounts'];
      if (socialCountsUrn) {
        const counts = includedMap.get(socialCountsUrn);
        if (counts?.$type === 'com.linkedin.voyager.dash.feed.SocialActivityCounts') {
          socialCounts = {
            likes: counts.numLikes ?? 0,
            comments: counts.numComments ?? 0,
            shares: counts.numShares ?? 0,
          };
        }
      }
    }
    
    const hashtags = getHashtags(commentary, includedMap);
    const mentionedCompanies = getMentionedCompanies(commentary, includedMap);

    const post: CompanyPost = {
      urn: updateObject.entityUrn,
      postUrl: updateObject.socialContent?.shareUrl,
      authorName: actor?.name?.text ?? 'Unknown Author',
      postedAt: actor?.subDescription?.text.split('•')[0].trim() ?? 'Unknown Date',
      postText: commentary?.text?.text ?? '',
      mediaType: getMediaType(updateObject),
      socialCounts,
      hashtags,
      mentionedCompanies,
    };
    
    extractedPosts.push(post);
  }

  return {
    posts: extractedPosts,
    paging: paging
  };
}






























// // extractor.ts

// import { VoyagerApiResponse, CompanyPost, SocialCounts, MediaType } from './types';

// /**
//  * Creates a lookup map from the 'included' array for efficient data retrieval.
//  * @param includedArray - The array of all data objects from the API response.
//  * @returns A Map where the key is the entityUrn and the value is the object.
//  */
// function createIncludedMap(includedArray: any[]): Map<string, any> {
//   return new Map(includedArray.map(item => [item.entityUrn, item]));
// }

// /**
//  * Extracts hashtags from a post's commentary component.
//  * @param commentaryComponent - The commentary object from the included map.
//  * @param includedMap - The lookup map of all included data.
//  * @returns An array of hashtag strings.
//  */
// function getHashtags(commentaryComponent: any, includedMap: Map<string, any>): string[] {
//   if (!commentaryComponent?.text?.attributesV2) {
//     return [];
//   }

//   const hashtags: string[] = [];
//   for (const attribute of commentaryComponent.text.attributesV2) {
//     const hashtagUrn = attribute.detailData?.['*hashtag'];
//     if (hashtagUrn) {
//       const hashtagObject = includedMap.get(hashtagUrn);
//       if (hashtagObject?.$type === 'com.linkedin.voyager.dash.feed.Hashtag' && hashtagObject.trackingUrn) {
//         // Example trackingUrn: "urn:li:hashtag:hiring"
//         const hashtagText = hashtagObject.trackingUrn.split(':').pop();
//         if (hashtagText) {
//           hashtags.push(hashtagText);
//         }
//       }
//     }
//   }
//   return hashtags;
// }

// /**
//  * Extracts mentioned companies from a post's commentary component.
//  * @param commentaryComponent - The commentary object from the included map.
//  * @param includedMap - The lookup map of all included data.
//  * @returns An array of mentioned company objects.
//  */
// function getMentionedCompanies(commentaryComponent: any, includedMap: Map<string, any>): { name: string; url: string }[] {
//     if (!commentaryComponent?.text?.attributesV2) {
//         return [];
//     }

//     const companies: { name: string; url: string }[] = [];
//     for (const attribute of commentaryComponent.text.attributesV2) {
//         const companyUrn = attribute.detailData?.['*companyName'];
//         if (companyUrn) {
//             const companyObject = includedMap.get(companyUrn);
//             if (companyObject?.$type === 'com.linkedin.voyager.dash.organization.Company') {
//                 companies.push({
//                     name: companyObject.name,
//                     url: companyObject.url,
//                 });
//             }
//         }
//     }
//     return companies;
// }


// /**
//  * Determines the type of media in a post.
//  * @param updateObject - The main post update object.
//  * @returns The MediaType enum value.
//  */
// function getMediaType(updateObject: any): MediaType {
//   if (updateObject.$type === 'com.linkedin.voyager.dash.feed.Update' && updateObject.content?.promoComponent) {
//       return MediaType.PROMO;
//   }
//   if (updateObject['*resharedUpdate']) {
//     return MediaType.RESHARE;
//   }
//   if (updateObject.content?.linkedInVideoComponent) {
//     return MediaType.VIDEO;
//   }
//   if (updateObject.content?.imageComponent) {
//     return MediaType.IMAGE;
//   }
//   if (updateObject.commentary?.text?.text) {
//       return MediaType.TEXT;
//   }
//   return MediaType.UNKNOWN;
// }


// /**
//  * Analyzes the LinkedIn Voyager API response and extracts key information from company posts.
//  * @param apiResponse - The full JSON response from the LinkedIn API.
//  * @returns An array of structured CompanyPost objects.
//  */
// export function extractCompanyPosts(apiResponse: VoyagerApiResponse): CompanyPost[] {
//   const includedMap = createIncludedMap(apiResponse.included);
//   const postUrns = apiResponse.data.data.feedDashOrganizationalPageUpdatesByOrganizationalPageRelevanceFeed['*elements'];
  
//   const extractedPosts: CompanyPost[] = [];

//   for (const postUrn of postUrns) {
//     const updateObject = includedMap.get(postUrn);

//     // Ensure we are processing a valid feed update
//     if (updateObject?.$type !== 'com.linkedin.voyager.dash.feed.Update') {
//       continue;
//     }
    
//     // Skip promotional content that isn't a real post
//     if (getMediaType(updateObject) === MediaType.PROMO) {
//         continue;
//     }

//     const actor = updateObject.actor;
//     const commentary = updateObject.commentary;

//     // --- Social Counts Extraction ---
//     let socialCounts: SocialCounts = { likes: 0, comments: 0, shares: 0 };
//     const socialDetailUrn = updateObject['*socialDetail'];
//     if (socialDetailUrn) {
//       const socialDetail = includedMap.get(socialDetailUrn);
//       const socialCountsUrn = socialDetail?.['*totalSocialActivityCounts'];
//       if (socialCountsUrn) {
//         const counts = includedMap.get(socialCountsUrn);
//         if (counts?.$type === 'com.linkedin.voyager.dash.feed.SocialActivityCounts') {
//           socialCounts = {
//             likes: counts.numLikes ?? 0,
//             comments: counts.numComments ?? 0,
//             shares: counts.numShares ?? 0,
//           };
//         }
//       }
//     }
    
//     // --- Hashtags and Mentions Extraction ---
//     const hashtags = getHashtags(commentary, includedMap);
//     const mentionedCompanies = getMentionedCompanies(commentary, includedMap);

//     const post: CompanyPost = {
//       urn: updateObject.entityUrn,
//       postUrl: updateObject.socialContent?.shareUrl,
//       authorName: actor?.name?.text ?? 'Unknown Author',
//       postedAt: actor?.subDescription?.text.split('•')[0].trim() ?? 'Unknown Date',
//       postText: commentary?.text?.text ?? '',
//       mediaType: getMediaType(updateObject),
//       socialCounts,
//       hashtags,
//       mentionedCompanies,
//     };
    
//     extractedPosts.push(post);
//   }

//   return extractedPosts;
// }