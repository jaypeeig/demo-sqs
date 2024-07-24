const AWS = require('aws-sdk');
const {faker} = require('@faker-js/faker');

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: 'shopfront'
});

const sqs = new AWS.SQS({
  apiVersion: '2012-11-05',
  region: 'ap-southeast-1'
});

const QueueUrl = 'https://sqs.ap-southeast-1.amazonaws.com/362989642060/DemoQueue';

const sendMessage = function () {
  const params = {
    DelaySeconds: 2,
    MessageAttributes: {
      'Order': {
        DataType: 'String',
        StringValue: `Fried ${faker.animal.type()}`
      },
      'Customer': {
        DataType: 'String',
        StringValue: faker.name.findName()
      },
      'Email': {
        DataType: 'String',
        StringValue: faker.internet.email()
      }
    },
    MessageBody: `Mang Inasal New Order: ${faker.datatype.uuid()}`,
    QueueUrl
  };
  console.log('Payload', params)

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log('Error', err)
    } else {
      console.log('Success', data.MessageId)
    }
  })

}();
