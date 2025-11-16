import 'dotenv/config'
import app from './index'


const port: number = Number(process.env.PORT) || 3000

app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})