import express, { Request, Response } from 'express'
import { extractCompanyData } from './utils/extract-company-info'
import { extractCompanyPosts } from './utils/extract-company-posts'
import { extractCompanyJobs } from './utils/extract-company-jobs'
import { extractCompanyEmployees } from './utils/extract-company-people'

const app = express()

app.disable('x-powered-by')
app.use(express.json())



app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', reqDataTime: Date.now() })
})

app.get('/company', async (req: Request, res: Response) => {
  const cookieString: string = String(process.env.LI_COOKIE_STRING)
  const requiredApiKey: string = String(process.env.X_API_KEY)

  const { companyUniName, includeRawData } = req.query
  const xApiKey = req.headers['x-api-key'] as string | undefined

  if (Array.isArray(xApiKey)) {
    return res.status(400).json({ status: 'error', message: 'Invalid x-api-key header format.' })
  }
  if (!xApiKey) {
    return res.status(400).json({ status: 'error', message: 'no x-api-key header was provided.' })
  }
  if (xApiKey !== requiredApiKey.toString()) {
    return res.status(401).json({ status: 'error', message: 'not authorized.' })
  }
  if (!companyUniName) {
    return res.status(409).json({ status: 'error', message: 'companyUniName is required.' })
  }
  try {
    const response = await fetch(`https://www.linkedin.com/voyager/api/organization/companies?decorationId=com.linkedin.voyager.deco.organization.web.WebFullCompanyMain-28&q=universalName&universalName=${companyUniName}`, {
      headers: { ...allHeaders },
      "body": null,
      "method": "GET"
    })

    if (!response.ok) {
      console.error('req error: ', response.statusText)
      return res.status(409).json({ status: 'error', message: "request failed.", statusText: response.statusText, cookieString })
    }

    const data = await response.json()

    const companyInfo = extractCompanyData(data)

    if (!companyInfo) {
      return res.status(409).json({ status: 'error', message: "request failed.", cookieString })
    }

    res.json({ status: 'ok', companyInfo, rawData: includeRawData ? data : null })
  } catch (error) {
    console.error('/company error: ', error)
  }

})
app.get('/company/posts', async (req: Request, res: Response) => {
  const cookieString: string = String(process.env.LI_COOKIE_STRING)
  const requiredApiKey: string = String(process.env.X_API_KEY)

  const { companyUrn, includeRawData, start, count } = req.query
  const xApiKey = req.headers['x-api-key'] as string | undefined

  if (Array.isArray(xApiKey)) {
    return res.status(400).json({ status: 'error', message: 'Invalid x-api-key header format.' })
  }
  if (!xApiKey) {
    return res.status(400).json({ status: 'error', message: 'no x-api-key header was provided.' })
  }
  if (xApiKey !== requiredApiKey.toString()) {
    return res.status(401).json({ status: 'error', message: 'not authorized.' })
  }
  if (!companyUrn) {
    return res.status(409).json({ status: 'error', message: 'companyUniName is required.' })
  }
  try {
    const response = await fetch(`https://www.linkedin.com/voyager/api/graphql?variables=(count:${count ?? '10'},start:${start ?? '0'},moduleKey:ORGANIZATION_MEMBER_FEED_DESKTOP,organizationalPageUrn:urn%3Ali%3Afsd_organizationalPage%3A${companyUrn.toString().split(':')[3]})&queryId=voyagerFeedDashOrganizationalPageUpdates.827e11d165078dd7a5afaf1cba734121`, {
      headers: { ...allHeaders },
      "body": null,
      "method": "GET"
    })

    if (!response.ok) {
      console.error('req error: ', response.statusText)
      return res.status(409).json({ status: 'error', message: "request failed.", statusText: response.statusText, cookieString })
    }

    const data = await response.json()

    const companyPosts = extractCompanyPosts(data)

    if (!companyPosts) {
      return res.status(409).json({ status: 'error', message: "request failed.", cookieString })
    }

    res.json({ status: 'ok', companyPosts, rawData: includeRawData ? data : null })
  } catch (error) {
    console.error('/company error: ', error)
  }

})
app.get('/company/jobs', async (req: Request, res: Response) => {
  const cookieString: string = String(process.env.LI_COOKIE_STRING)
  const requiredApiKey: string = String(process.env.X_API_KEY)

  const { companyUrn, includeRawData, start, count } = req.query
  const xApiKey = req.headers['x-api-key'] as string | undefined

  if (Array.isArray(xApiKey)) {
    return res.status(400).json({ status: 'error', message: 'Invalid x-api-key header format.' })
  }
  if (!xApiKey) {
    return res.status(400).json({ status: 'error', message: 'no x-api-key header was provided.' })
  }
  if (xApiKey !== requiredApiKey.toString()) {
    return res.status(401).json({ status: 'error', message: 'not authorized.' })
  }
  if (!companyUrn) {
    return res.status(409).json({ status: 'error', message: 'companyUniName is required.' })
  }

  try {
    const response = await fetch(`https://www.linkedin.com/voyager/api/voyagerJobsDashJobCards?decorationId=com.linkedin.voyager.dash.deco.jobs.search.JobSearchCardsCollectionLite-60&count=${count ?? '10'}&q=jobSearch&query=(origin:JOB_SEARCH_PAGE_OTHER_ENTRY,selectedFilters:(company:List(${companyUrn.toString().split(':')[3]})),spellCorrectionEnabled:true)&start=${start ?? '0'}`, {
      headers: { ...allHeaders },
      "body": null,
      "method": "GET"
    })

    if (!response.ok) {
      console.error('req error: ', response.statusText)
      return res.status(409).json({ status: 'error', message: "request failed.", statusText: response.statusText, cookieString })
    }

    const data = await response.json()

    const companyJobs = extractCompanyJobs(data)

    if (!companyJobs) {
      return res.status(409).json({ status: 'error', message: "request failed.", cookieString })
    }

    res.json({ status: 'ok', companyJobs, rawData: includeRawData ? data : null })
  } catch (error) {
    console.error('/company/jobs error: ', error)
  }

})
app.get('/company/people', async (req: Request, res: Response) => {
  const cookieString: string = String(process.env.LI_COOKIE_STRING)
  const requiredApiKey: string = String(process.env.X_API_KEY)

  const { companyUrn, includeRawData, start, count } = req.query
  const xApiKey = req.headers['x-api-key'] as string | undefined

  if (Array.isArray(xApiKey)) {
    return res.status(400).json({ status: 'error', message: 'Invalid x-api-key header format.' })
  }
  if (!xApiKey) {
    return res.status(400).json({ status: 'error', message: 'no x-api-key header was provided.' })
  }
  if (xApiKey !== requiredApiKey.toString()) {
    return res.status(401).json({ status: 'error', message: 'not authorized.' })
  }
  if (!companyUrn) {
    return res.status(409).json({ status: 'error', message: 'companyUniName is required.' })
  }
  console.log('urn: ', companyUrn.toString().split(':')[3])
  try {
    const response = await fetch(`https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(start:${start ?? '0'},origin:FACETED_SEARCH,query:(flagshipSearchIntent:ORGANIZATIONS_PEOPLE_ALUMNI,queryParameters:List((key:currentCompany,value:List(${companyUrn.toString().split(':')[3]})),(key:resultType,value:List(ORGANIZATION_ALUMNI))),includeFiltersInResponse:true),count:${count ?? '10'})&queryId=voyagerSearchDashClusters.ef3d0937fb65bd7812e32e5a85028e79`, {
      headers: { ...allHeaders },
      "body": null,
      "method": "GET"
    })

    if (!response.ok) {
      console.error('req error: ', response.statusText)
      return res.status(409).json({ status: 'error', message: "request failed.", statusText: response.statusText, cookieString })
    }

    const data = await response.json()

    const companyEployees = extractCompanyEmployees(data)

    if (!companyEployees) {
      return res.status(409).json({ status: 'error', message: "request failed.", cookieString })
    }

    res.json({ status: 'ok', companyEployees, rawData: includeRawData ? data : null })
  } catch (error) {
    console.error('/company/people error: ', error)
  }

})

export default app



const cookieString: string = String(process.env.LI_COOKIE_STRING)

const allHeaders = {
  "accept": "application/vnd.linkedin.normalized+json+2.1",
  "accept-language": "en-US,en;q=0.9,ar;q=0.8",
  "csrf-token": "ajax:3577247525829652502",
  "priority": "u=1, i",
  "sec-ch-prefers-color-scheme": "dark",
  "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-li-lang": "en_US",
  "x-restli-protocol-version": "2.0.0",
  "cookie": cookieString
}

const testCookieStr = "bcookie=\"v=2&3b076e4c-417e-4a36-8eef-0a952ffadfc0\"; bscookie=\"v=1&20231007220922451f11ba-f276-41f2-870b-40b112ffe903AQEh0x3D2U4IquD3tFKxLTzbFPBjXNOY\"; li_theme=light; li_theme_set=app; li_rm=AQGYKYqroKYikAAAAZPGV96nVpss2MgFUenx6NS_J-ih-qPQOjEPl-RUPUR22NUzr0ub5VnT2hTy478a7-DTDG-GYGxAggjCValw4pNt5f3ULEvA5wFg2sIybUoq5ouGOYEYVEpRRy1IkiLZXR_vzDt1I3OqMlHvjUEDbSa4Y7939Ft-IemLFzQhL8q2nOC98kJqpad7vDGWDE5OuP0WDHHg1mq81THrHyo2i9dGwX1oA8N8RlgluoFNEWy8aJWVk2UbSkcuO5ls6BzeOCL2vYGzLWl-6C9GRKIIfVyv4LTNgMq9tXAivfJvsevnJxi1jW64C6Fz6UldANnBSNc; dfpfpt=fd01d71715f04f5d8863d9f63c6f14ec; visit=v=1&M; JSESSIONID=\"ajax:3577247525829652502\"; _uetvid=4a610d1021ca11f099a57ff16040e432; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20276%7CMCMID%7C92106639193587518152483628507092164012%7CMCAAMLH-1752407400%7C7%7CMCAAMB-1752407400%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1751809800s%7CNONE%7CMCCIDH%7C1354631602%7CvVersion%7C5.1.1; bitmovin_analytics_uuid=4bdd29d7-a91c-4e00-b0f6-9b3c768bf907; li_gc=MTswOzE3NTY1OTAzNzI7MjswMjFX5AzjKtPUBnEH5ckK+cL9Yd9pCCRhjNyPJMeahs5oAw==; timezone=Etc/GMT-1; _pxvid=2ead64e1-d42d-11ef-bbb4-6d85f17a939d; li_at=AQEDASQxh-0Db_PyAAABmnIdvwIAAAGalipDAk4Agzsoqo8il2uQbATOXWr3OtBBkCFNsEWNkTzuYbtW74IWu9RJyRoK7pTQNKsQblHFPzn56YIuu21tRX3VdxEn1d8qztdmjuhqFjbz6ALGpenwlMqo; liap=true; sdui_ver=sdui-flagship:0.1.19572+SduiFlagship0; lang=v=2&lang=en-us; li-protect=true; fptctx2=taBcrIH61PuCVH7eNCyH0K%252fD9DJ44Cptuv0RyrXgXCtJzQvtVYMEtE8UEp%252fIMCiZBHUF%252blqh%252b2wHrfoIKZ0OV9pneFXgKqlBUkbmZSIKrghKpnsDqaB1YQIKY2Kwr9ouw4QLrq8tboKbZFE3Bty0yGcQRK6ojorKiQl%252f6TNV93FM12rcZoH1EDaNrKcHQtByhi03UwqWtlydFb2kTOOLR3sPcb%252bD3a%252ffrhkqSJD8VVF9%252bxYP10UM1BL7QK0jwqTZjB%252fL4K9NgSsKyBVbHvXbMLFX2aOKXh6kvrRp8u26MaXoRrFLCIYtA1%252blQC3L1Zx%252fbiYn5gugjiJkT7%252bWnXQAK3fAsUqvjdqt7eUI9HC1DMs%253d; lidc=\"b=TB37:s=T:r=T:a=T:p=T:g=5244:u=126:x=1:i=1763365528:t=1763451928:v=2:sig=AQESXftLacSLdhyK8XI2h_vpt4HukfyN\"; __cf_bm=uVspdrsTkORYxYb7tY5ID8R8v32zku210DXRg81Ny9M-1763366715-1.0.1.1-tLtXAVAsKgUEM2HwNTFXj7FTsXd4yP4ffwKM_FYcQ3_GWdTBP1k63Zn5i_U0nsExYG6FS5IEBj5etuvizoLkCGEoNXX3M9Wm3SP1w3Ktqbg; _dd_s=logs=1&id=8d73690f-f614-4927-8576-06ad98cf076e&created=1763367357002&expire=1763368261590"