import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { CloudFrontAllowedMethods, CloudFrontWebDistribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { CanonicalUserPrincipal } from 'aws-cdk-lib/aws-iam';
export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appBucket = new s3.Bucket(this, 'rs-react-app-s3', {
      bucketName: 'rs-reactapp',
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });

    const cloudFrontOAI = new OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: `Cloudfront RS-REACT-APP OAI`,
    });

    appBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
      sid: 's3BucketPublicRead',
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [
        new CanonicalUserPrincipal(
          cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [`${appBucket.bucketArn}/*`],
    })
    );

    const distribution = new CloudFrontWebDistribution(this, 'rs-react-app-cf-distribution', {
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: appBucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
            },
          ],
        },
      ],
    }
    );

    new cdk.aws_s3_deployment.BucketDeployment(this, `rs-react-app-deployment`, {
      destinationBucket: appBucket,
      sources: [cdk.aws_s3_deployment.Source.asset(`../dist`)],
      distribution,
      distributionPaths: ['/*'],
    }
    );
  }
}
