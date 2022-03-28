const AWS = require('aws-sdk');

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: 'shopfront'
});

const sqs = new AWS.SQS({
  apiVersion: '2012-11-05',
  region: 'ap-southeast-1'
});

const QueueUrl = 'https://ap-southeast-1.queue.amazonaws.com/362989642060/DemoQueue';

const deleteMessage = (ReceiptHandle) => {
    const deleteParams = {
      QueueUrl,
      ReceiptHandle
    };
    sqs.deleteMessage(deleteParams, (err, data) => {
      if (err) {
        console.log('Delete Error', err)
      } else {
        console.log('Message Deleted', data)
      }
    })
}

const recieveMessage = function () {
  const params = {
    MaxNumberOfMessages: 5,
    QueueUrl
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) {
      console.log('Error', err)
    } else if (data.Messages) {
      data.Messages.forEach(msg => {
        console.log('Process Order:', msg)
        deleteMessage(msg.ReceiptHandle)
      })
    }
  })

}();
