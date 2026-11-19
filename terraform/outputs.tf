output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the two public subnets"
  value       = aws_subnet.public[*].id
}

output "availability_zones" {
  description = "AZs used by the public subnets"
  value       = aws_subnet.public[*].availability_zone
}

output "alb_security_group_id" {
  description = "Security group ID for the ALB"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "Security group ID for the ECS tasks"
  value       = aws_security_group.ecs.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB todos table"
  value       = aws_dynamodb_table.todos.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB todos table"
  value       = aws_dynamodb_table.todos.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing images"
  value       = aws_ecr_repository.app.repository_url
}



output "ecs_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "github_deploy_role_arn" {
  description = "ARN of the GitHub Actions deploy role"
  value       = aws_iam_role.github_deploy.arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_task_definition_arn" {
  description = "ECS task definition ARN"
  value       = aws_ecs_task_definition.app.arn
}

output "ecs_task_family" {
  description = "ECS task family name"
  value       = aws_ecs_task_definition.app.family
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.app.name
}

output "alb_dns_name" {
  description = "Public DNS name of the ALB"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.app.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "app_url" {
  description = "Public URL of the running application"
  value       = "http://${aws_lb.main.dns_name}"
}
