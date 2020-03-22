export const mockData = [
  {
    id: 'event1Id',
    title: 'event1Name',
    startTime: new Date(
      'Sat Mar 14 2020 19:56:24 GMT-0600 (Mountain Daylight Time)'
    ),
    endTime: new Date(
      'Sat Mar 14 2020 20:56:24 GMT-0600 (Mountain Daylight Time)'
    ),
    lookupTags: ['Entity1name', 'jobsite2name', 'entity2name', 'Jobsite1name'],
    style: {
      text: '#f123321',
      bg: '#102591'
    }
  },
  {
    id: 'event2Id',
    title: 'event2Name finish 21:56',
    startTime: new Date(
      'Sat Mar 14 2020 19:56:24 GMT-0600 (Mountain Daylight Time)'
    ),
    endTime: new Date(
      'Sat Mar 14 2020 21:56:24 GMT-0600 (Mountain Daylight Time)'
    ),
    lookupTags: ['entity2name', 'Jobsite1name'],
    style: {
      text: '#f983321',
      bg: '#ad77ff'
    }
  },
  {
    id: 'event3Id',
    title: 'event3Name finish:20;56',
    startTime: new Date(
      'Sat Mar 14 2020 20:36:24 GMT-0600 (Mountain Daylight Time)'
    ),
    endTime: new Date(
      'Sat Mar 14 2020 20:56:24 GMT-0600 (Mountain Daylight Time)'
    ),
    lookupTags: ['entity2name', 'jobsite2name'],
    style: {
      text: '#f933321',
      bg: '##3568ff'
    }
  }
]
