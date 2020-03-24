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
    },
    detailContent: [
      { label: 'Event', value: 'event1Name' },
      { label: 'Description', value: 'this is a dumb example of description' },
      { label: 'Type', value: 'an event type' },
      { label: 'priority', value: 'high' }
    ]
  },
  {
    id: 'event2Id',
    title: 'event2Name',
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
    },
    detailContent: [
      { label: 'Event', value: 'event2Name' },
      { label: 'Description', value: 'something something' },
      { label: 'Type', value: 'another event type' },
      { label: 'priority', value: 'Low' }
    ]
  },
  {
    id: 'event3Id',
    title: 'event3Name',
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
    },
    detailContent: [
      { label: 'Event', value: 'event3Name' },
      { label: 'Type', value: 'yes' },
      { label: 'priority', value: 'meidum' }
    ]
  }
]
