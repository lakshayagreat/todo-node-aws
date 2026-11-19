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