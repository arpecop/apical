import { insert } from '../_includes/dynamodb.client.mjs'

insert('test', {
  _id: '040306fde18885134867bcbc3ec80d58',
  _rev: '1-96258caaa4bbdfd6549c4b3662e18467',
  title: 'fdsfds',
  date: '12/07/18',
  href:
    'https://dnes.dir.bg/svyat/sasht-obviniha-phenyan-che-narushava-sanktsii-na-oon',
  image: 'https://static.dir.bg/uploads/images/2018/06/12/1296805/384x216.jpg',
  content: { html: ['test', 'me"st'] }
})
