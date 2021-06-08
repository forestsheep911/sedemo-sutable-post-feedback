import { KintoneRestAPIClient } from '@kintone/rest-api-client'

const client = new KintoneRestAPIClient({
  baseUrl: 'https://cndevqpofif.cybozu.cn',
  // Use password authentication
  auth: {
    username: `dog`,
    password: `1`,
  },
  // Use API token authentication
  // auth: { apiToken: process.env.KINTONE_API_TOKEN }
  // Use OAuth token authentication
  // auth: { oAuthToken: process.env.KINTONE_OAUTH_TOKEN }

  // Use session authentication if `auth` is omitted (in browser only)
})

// 自己环境中需要更新的appid
const UPDATE_APP_ID = 14

function postRecordOneByOne(app, record) {
  return kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
    app,
    record,
  })
}

kintone.events.on(
  [
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.create.change.my_subtable',
    'app.record.edit.change.my_subtable',
  ],
  (event) => {
    const rd = event.record
    rd.my_subtable.value.forEach((element) => {
      const ele = element
      ele.value.sb_callback_rd_no.disabled = true
    })
    return event
  },
)

kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], async (event) => {
  const thisrecord = event.record
  // 筛选是更新的对象
  const readyToPutRecords = thisrecord.my_subtable.value
    .map((current) => {
      // 有关联的编号说明是更新的对象
      if (current.value.sb_callback_rd_no.value) {
        return {
          id: current.value.sb_callback_rd_no.value,
          record: {
            pd_title: { value: current.value.sb_title.value },
          },
        }
      }
      return null
    })
    // 去除null,也就是更新以外的数组成员
    .filter((x) => x)
  await client.record.updateAllRecords({ app: UPDATE_APP_ID, records: readyToPutRecords })
  const postResponseAll = () => {
    return Promise.all(
      thisrecord.my_subtable.value.map(async (current, index, array) => {
        // 提取原数组中的对象，current是副本，更新它没有意义
        const ar = array[index]
        // 没有关联记录编号说明是本次新增的记录
        if (!current.value.sb_callback_rd_no.value) {
          const postResponse = await postRecordOneByOne(UPDATE_APP_ID, {
            pd_title: { value: current.value.sb_title.value },
          })
          // 把新增记录所产生的id赋给原数组中的对象，等于更新了event中的record
          // 等到最后return event时，便会提交数据
          ar.value.sb_callback_rd_no.value = postResponse.id
          return postResponse
        }
        return '不是新增的记录'
      }),
    )
  }
  await postResponseAll()
  return event
})
