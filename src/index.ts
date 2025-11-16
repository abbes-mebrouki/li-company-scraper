import express, { Request, Response } from 'express'
import { extractCompanyData } from './utils/extract-company-info'

const app = express()

app.disable('x-powered-by')
app.use(express.json())

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/company', async (req: Request, res: Response) => {
  const cookieString: string = String(process.env.cookieString)

  const { companyUniName } = req.query
  if (!companyUniName) {
    return res.json({ status: 'error', message: 'companyUniName is required.' }).status(409)
  }
  try {
    const response = await fetch(`https://www.linkedin.com/voyager/api/organization/companies?decorationId=com.linkedin.voyager.deco.organization.web.WebFullCompanyMain-28&q=universalName&universalName=${companyUniName}`, {
      "headers": {
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
        "cookie": cookieString,
        "Referer": "https://www.linkedin.com/company/priority-title-escrow/?trk=public_jobs_topcard-org-name"
      },
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

    res.json({ status: 'ok', companyInfo, rawData: data })
  } catch (error) {
    console.error('/company error: ', error)
  }

})

export default app