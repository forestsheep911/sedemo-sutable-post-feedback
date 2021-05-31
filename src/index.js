/*
readme
本DEMO的基本逻辑
新增数据用逐条更新的方式；更新数据用批量更新的方式；
步骤：
先提取subtable中的内容，然后分成新增和更新2部分，分别去执行相应代码。
新增会有id返回，所以需要写回subtable。
后记：
如逐条追加的性能不能满足要求，则需要做后续的研究，使用批量的问题在于需要解决返回id的对应匹配问题。
 */
// 更新数据
function putRecords(app, records) {
  const limit = 100
  return Promise.all(
    records
      .reduce(
        function splitBlock(recordsBlocks, record) {
          if (recordsBlocks[recordsBlocks.length - 1].length === limit) {
            recordsBlocks.push([record])
          } else {
            recordsBlocks[recordsBlocks.length - 1].push(record)
          }
          return recordsBlocks
        },
        [[]],
      )
      .map(function doPut(recordsBlock) {
        console.log(`${new Date().getSeconds()} ${new Date().getMilliseconds()}`)
        return kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', {
          app,
          records: recordsBlock,
        })
        // .then(function cb(resp) {
        //   console.log(`${new Date().getSeconds()} ${new Date().getMilliseconds()}`)
        //   kintone.error()
        // })
        // .catch((e) => {
        //   return e
        // })
      }),
  )
}

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
  // const startTime = new Date().getTime()
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
  // try {
  await putRecords(14, readyToPutRecords)
  // } catch (e) {
  //   return e
  // }
  const postResponseAll = () => {
    return Promise.all(
      thisrecord.my_subtable.value.map(async (current, index, array) => {
        // 提取原数组中的对象，current是副本，更新它没有意义
        const ar = array[index]
        // 没有关联记录编号说明是本次新增的记录
        if (!current.value.sb_callback_rd_no.value) {
          const postResponse = await postRecordOneByOne(14, {
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
