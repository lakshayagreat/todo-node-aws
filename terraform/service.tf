resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # Give the first deploy time to pull the image and start
  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }

  # Wait for the ALB to confirm the task is healthy before declaring success
  wait_for_steady_state = true

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy.ecs_task_dynamodb,
    aws_iam_role_policy_attachment.ecs_execution_managed
  ]

  tags = {
    Name = "${var.project_name}-service"
  }
}