# s3-service
A sample Node.js implementation repo for working with AWS S3 
# Sample request for reading from S3
URL: https://sample-domain.com/s3op/readfile/{formId}
# Sample request for writing in S3
  URL: https://sample-domain.com/s3op/writefile/event
  # Send the body in json array format
[{
    "formId": "form1",
    "result": [{
        "att1": "att1",
        "val1": "1"
    }, {
        "att2": "att2",
        "val2": "2"
    }, {
        "att3": "att3",
        "val3": "3"
    }],
    "submittedTime": "2015-08-09T21:19+02:00"
}]
# How to run:
$ lambda-local -l index.js -h handle -E "{\"account\":\"dev\"}" -e event_path/event.json -t 10
