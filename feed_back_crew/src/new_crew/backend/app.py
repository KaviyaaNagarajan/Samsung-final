from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os

from new_crew.crew import OrganizationFeedbackCrew

app = FastAPI(
    title="Organization Feedback Intelligence API",
    description="Analyzes real user & industry feedback using CrewAI + Serper",
    version="1.0.0"
)

# -------------------------
# Request / Response Models
# -------------------------
class FeedbackRequest(BaseModel):
    company_name: str


class TaskOutput(BaseModel):
    task_name: str
    task_id: Optional[str] = None
    status: str
    output: str
    agent: str


class FeedbackResponse(BaseModel):
    company_name: str
    tasks: List[TaskOutput]
    final_result: str


# -------------------------
# Health Check
# -------------------------
@app.get("/")
def health_check():
    return {"status": "ok", "message": "Feedback Intelligence API is running"}


# -------------------------
# Main Endpoint
# -------------------------
@app.post("/analyze", response_model=FeedbackResponse)
def analyze_feedback(payload: FeedbackRequest):
    task_outputs = []
    result = None
    error_message = None
    
    try:
        company_name = payload.company_name.strip()

        if not company_name:
            raise HTTPException(status_code=400, detail="company_name cannot be empty")

        # Initialize crew
        crew_instance = OrganizationFeedbackCrew()
        crew = crew_instance.crew()

        # Execute crew with error handling
        try:
            result = crew.kickoff(
                inputs={"company_name": company_name}
            )
        except Exception as crew_error:
            # Crew execution failed, but we can still try to extract completed tasks
            error_message = f"Crew execution encountered an error: {str(crew_error)}"
            # Continue to try extracting task outputs from completed tasks
        
        # Define task mappings
        task_mappings = [
            {"name": "collect_user_feedback", "agent": "User Feedback Intelligence Analyst"},
            {"name": "analyze_industry_feedback", "agent": "Industry & Market Perception Analyst"},
            {"name": "synthesize_final_insights", "agent": "Strategic Insight Synthesizer"}
        ]
        
        # Extract task outputs from the execution (even if crew failed, some tasks may have completed)
        
        # Try multiple methods to extract task outputs
        # Method 1: From crew.tasks if available (after execution)
        if hasattr(crew, 'tasks'):
            for idx, task in enumerate(crew.tasks):
                try:
                    # Get task name from mapping or task itself
                    task_name = task_mappings[idx]["name"] if idx < len(task_mappings) else "Unknown Task"
                    
                    # Get task config name if available
                    if hasattr(task, 'config') and isinstance(task.config, dict):
                        if 'description' in task.config:
                            # Extract task name from description or use mapping
                            pass
                    
                    task_id = str(task.id) if hasattr(task, 'id') else f"task_{idx + 1}"
                    status = getattr(task, 'status', 'completed')
                    
                    # Get output - try multiple approaches
                    output_text = "No output available"
                    if hasattr(task, 'output'):
                        try:
                            # Try accessing raw property first
                            if hasattr(task.output, 'raw'):
                                output_text = str(task.output.raw)
                            # Try content property
                            elif hasattr(task.output, 'content'):
                                output_text = str(task.output.content)
                            # Try as string directly
                            else:
                                output_text = str(task.output)
                        except Exception as output_err:
                            # If direct access fails, try alternative methods
                            try:
                                output_text = str(task.output)
                            except:
                                output_text = f"Output extraction failed: {str(output_err)}"
                    # Try result attribute
                    elif hasattr(task, 'result'):
                        try:
                            output_text = str(task.result)
                        except:
                            output_text = "Result extraction failed"
                    # Try executed_output if available
                    elif hasattr(task, 'executed_output'):
                        try:
                            output_text = str(task.executed_output)
                        except:
                            pass
                    
                    # Get agent name
                    agent_name = task_mappings[idx]["agent"] if idx < len(task_mappings) else "Unknown Agent"
                    if hasattr(task, 'agent'):
                        try:
                            if hasattr(task.agent, 'role'):
                                agent_name = task.agent.role
                            elif hasattr(task.agent, 'config') and isinstance(task.agent.config, dict):
                                agent_name = task.agent.config.get('role', agent_name)
                        except:
                            pass
                    
                    task_outputs.append(TaskOutput(
                        task_name=task_name,
                        task_id=task_id,
                        status=status,
                        output=output_text,
                        agent=agent_name
                    ))
                except Exception as e:
                    # If we can't extract task details, create a placeholder
                    task_outputs.append(TaskOutput(
                        task_name=task_mappings[idx]["name"] if idx < len(task_mappings) else f"Task {idx + 1}",
                        task_id=f"task_{idx + 1}",
                        status="completed",
                        output=f"Error extracting output: {str(e)}",
                        agent=task_mappings[idx]["agent"] if idx < len(task_mappings) else "Unknown Agent"
                    ))
        
        # Method 2: Try to extract from result object
        if not task_outputs and hasattr(result, 'tasks_output'):
            task_names = ["collect_user_feedback", "analyze_industry_feedback", "synthesize_final_insights"]
            agents = ["User Feedback Intelligence Analyst", "Industry & Market Perception Analyst", "Strategic Insight Synthesizer"]
            
            tasks_output = result.tasks_output if isinstance(result.tasks_output, list) else [result.tasks_output]
            for idx, task_out in enumerate(tasks_output):
                if idx < len(task_names):
                    task_outputs.append(TaskOutput(
                        task_name=task_names[idx],
                        task_id=f"task_{idx + 1}",
                        status="completed",
                        output=str(task_out),
                        agent=agents[idx] if idx < len(agents) else "Unknown Agent"
                    ))
        
        # Method 3: If we still don't have task outputs, create placeholders
        if not task_outputs and hasattr(crew, 'tasks'):
            # Create placeholder task outputs based on mappings
            for idx, mapping in enumerate(task_mappings):
                status = "pending"
                output_text = "Task not executed or output not available"
                
                # Check task status if available
                if idx < len(crew.tasks):
                    task = crew.tasks[idx]
                    status = getattr(task, 'status', 'pending')
                    if status == 'completed' or (hasattr(task, 'output') and task.output):
                        output_text = "Output extraction failed - see final_result for details"
                
                # If crew failed, mark remaining tasks appropriately
                if error_message and status not in ['completed', 'failed']:
                    status = "failed" if idx > 0 else "completed"  # First task usually completes
                
                task_outputs.append(TaskOutput(
                    task_name=mapping["name"],
                    task_id=f"task_{idx + 1}",
                    status=status,
                    output=output_text,
                    agent=mapping["agent"]
                ))

        # Prepare final result string
        final_result_str = str(result) if result else (error_message or "No result available")
        
        # If there was an error but we have some task outputs, return partial success
        if error_message:
            # Still return what we have, but include the error
            return FeedbackResponse(
                company_name=company_name,
                tasks=task_outputs,
                final_result=f"⚠️ {error_message}\n\nPartial results from completed tasks:\n{final_result_str}"
            )

        return FeedbackResponse(
            company_name=company_name,
            tasks=task_outputs,
            final_result=final_result_str
        )

    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        import traceback
        # If we have any task outputs, return them with the error
        if task_outputs:
            return FeedbackResponse(
                company_name=payload.company_name if hasattr(payload, 'company_name') else "Unknown",
                tasks=task_outputs,
                final_result=f"⚠️ Error occurred: {str(e)}\n{traceback.format_exc()}"
            )
        # Otherwise, raise HTTP exception
        raise HTTPException(
            status_code=500,
            detail=f"Feedback analysis failed: {str(e)}\n{traceback.format_exc()}"
        )
