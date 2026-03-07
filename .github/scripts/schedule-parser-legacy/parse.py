import openparse
import os
import json
import re
import uuid
import PyPDF2
from datetime import datetime
from PyPDF2 import PdfMerger

# Get input and output directories from environment variables (for workflow)
# or use default values (for manual usage)
input_folder = os.environ.get('SCHEDULE_INPUT_DIR', './input')
output_folder = os.environ.get('SCHEDULE_OUTPUT_DIR', './output')

print(f"📁 Input folder: {input_folder}")
print(f"📁 Output folder: {output_folder}")

# Create output folder if it doesn't exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)
    print(f"✅ Created output directory: {output_folder}")

def merge_pdfs_to_single_file(pdf_files, output_path):
    """Merge multiple PDF files into a single PDF"""
    try:
        merger = PdfMerger()
        
        for pdf_file in pdf_files:
            if os.path.exists(pdf_file):
                print(f"📎 Adding {os.path.basename(pdf_file)} to merged PDF")
                merger.append(pdf_file)
            else:
                print(f"⚠️  Warning: {pdf_file} not found, skipping")
        
        # Write the merged PDF
        with open(output_path, 'wb') as output_file:
            merger.write(output_file)
        
        merger.close()
        print(f"✅ Successfully merged {len(pdf_files)} PDFs into: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error merging PDFs: {e}")
        return False

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyPDF2 to get full page content"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            full_text = ""
            
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                full_text += f"\n--- PAGE {page_num + 1} ---\n"
                full_text += page_text
                full_text += "\n"
            
            return full_text
    except Exception as e:
        print(f"❌ Error reading PDF with PyPDF2: {e}")
        return None

def extract_group_name_from_full_text(full_text):
    """Extract group names from the full PDF text"""
    if not full_text:
        return None
    
    lines = full_text.split('\n')
    
    for line in lines:
        line = line.strip()
        
        if 'Group' in line:
            group_match = re.search(r'Group\s+([A-Z0-9\-]+)', line)
            if group_match:
                return group_match.group(1)
            
            if 'Group' in line:
                group_part = line.split('Group', 1)[1].strip()
                if group_part:
                    return group_part
        
        elif re.match(r'^[A-Z]{2,4}-\d{4}[A-Z]?$', line):
            return line
        
        elif re.search(r'[A-Z]{2,4}-\d{4}[A-Z]?', line):
            group_match = re.search(r'[A-Z]{2,4}-\d{4}[A-Z]?', line)
            if group_match:
                return group_match.group(0)
    
    return None

def parse_markdown_table(markdown_content):
    """Parse markdown table content into structured data"""
    lines = markdown_content.strip().split('\n')
    
    header_line = None
    separator_line = None
    data_lines = []
    
    for i, line in enumerate(lines):
        if '|' in line and 'Day of the week' in line:
            header_line = line
            separator_line = lines[i + 1] if i + 1 < len(lines) else None
            data_lines = lines[i + 2:]
            break
    
    if not header_line:
        return None
    
    headers = [h.strip() for h in header_line.split('|')[1:-1]]
    
    schedule_entries = []
    current_day = None
    
    for line in data_lines:
        if not line.strip() or '|' not in line:
            continue
            
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        if len(cells) != len(headers):
            continue
            
        if cells[0] and cells[0] != '':
            current_day = cells[0]
        
        if not cells[1] or cells[1] == '':
            continue
            
        disciplines_text = cells[2].strip()
        classrooms_text = cells[3].strip()
        types_text = cells[4].strip()
        lecturers_text = cells[5].strip()
        
        disciplines = []
        if disciplines_text:
            course_patterns = [
                r'Secure computer network architecture',
                r'Product Management',
                r'Behavioral competencies for project management',
                r'Agile Project Management',
                r'Investigation of software source code for vulnerabilities',
                r'Software Development Case Study',
                r'Neural Networks',
                r'Advanced Quality Assurance',
                r'Data-driven decision-making',
                r'Teaching methods and strategies',
                r'Machine learning and artificial intelligence',
                r'Markov chains and decision-making processes',
                r'High-performance computing',
                r'Communication in project management',
                r'Production processes and production of audiovisual media content',
                r'Game design theory',
                r'Audit of processes in information security',
                r'Applied mathematical models',
                r'Advanced Binary Analysis Techniques',
                r'IT Audit and Control',
                r'Marketing in the public sector'
            ]
            
            remaining_text = disciplines_text
            found_courses = []
            
            for pattern in course_patterns:
                if pattern in remaining_text:
                    found_courses.append(pattern)
                    remaining_text = remaining_text.replace(pattern, '', 1).strip()
            
            if found_courses:
                disciplines = found_courses
                if remaining_text:
                    disciplines.append(remaining_text)
            else:
                disciplines = [disciplines_text]
        
        classrooms = [c.strip() for c in classrooms_text.split() if c.strip()] if classrooms_text else []
        types = [t.strip() for t in types_text.split() if t.strip()] if types_text else []
        lecturers_parts = lecturers_text.split() if lecturers_text else []
        
        lecturers = []
        if lecturers_text:
            lecturer_patterns = [
                r'Vacancy 1-DISS',
                r'Samalgul Nassanbekova',
                r'Anara Yesengeldina', 
                r'Vacancy 3 - SCI',
                r'Glazyrina Natalya',
                r'Aubakirov Sanzhar',
                r'Niyazova R\.S\.',
                r'Aigul Adamova',
                r'Akbergenov Yerkin',
                r'https://learn\.astanait\.edu\.kz/',
                r'Mohammadzadeh Ardashir',
                r'Minsoo Han',
                r'Adai Shomanov',
                r'Omarova Safura',
                r'Aidos Mukhatayev',
                r'Raskaliyev Timur',
                r'Shakhmetova Gulmira',
                r'Abitova Gulnara',
                r'Gaini Mukhanova',
                r'Bolatbek Rysbayevich',
                r'Kashkimbayeva Nurzhamal',
                r'Kaibassova Dinara',
                r'Mergen Duisenov'
            ]
            
            remaining_text = lecturers_text
            found_lecturers = []
            
            for pattern in lecturer_patterns:
                matches = re.findall(pattern, remaining_text)
                for match in matches:
                    found_lecturers.append(match)
                    remaining_text = re.sub(pattern, '', remaining_text, count=1).strip()
            
            if found_lecturers:
                lecturers = found_lecturers
                if remaining_text:
                    lecturers.append(remaining_text)
            else:
                lecturers = [lecturers_text]
        
        entry = {
            'day': current_day,
            'time': cells[1],
            'disciplines': disciplines,
            'classrooms': classrooms,
            'types': types,
            'lecturers': lecturers
        }
        
        if entry['disciplines'] == ['']:
            entry['disciplines'] = []
        if entry['classrooms'] == ['']:
            entry['classrooms'] = []
        if entry['types'] == ['']:
            entry['types'] = []
        if entry['lecturers'] == ['']:
            entry['lecturers'] = []
            
        schedule_entries.append(entry)
    
    return {
        'headers': headers,
        'entries': schedule_entries
    }

def create_course_objects(parsed_table, group_name):
    """Create individual course objects in the required format"""
    if not parsed_table:
        return []
    
    course_objects = []
    
    for entry in parsed_table['entries']:
        if entry['day'] == 'Day of the week':
            continue
            
        time_parts = entry['time'].split('-')
        if len(time_parts) == 2:
            start_time = time_parts[0].strip()
            end_time = time_parts[1].strip()
            
            for i, discipline in enumerate(entry['disciplines']):
                classroom = entry['classrooms'][i] if i < len(entry['classrooms']) else entry['classrooms'][0] if entry['classrooms'] else "TBD"
                course_type = entry['types'][i] if i < len(entry['types']) else entry['types'][0] if entry['types'] else "TBD"
                lecturer = entry['lecturers'][i] if i < len(entry['lecturers']) else entry['lecturers'][0] if entry['lecturers'] else "TBD"
                
                is_online = "online" in classroom.lower()
                
                course_obj = {
                    "id": str(uuid.uuid4())[:13],
                    "start": f"{entry['day']} {start_time}",
                    "end": f"{entry['day']} {end_time}",
                    "courseName": discipline.strip(),
                    "location": classroom.strip(),
                    "isOnline": is_online,
                    "teacher": lecturer.strip(),
                    "type": course_type.strip()
                }
                
                course_objects.append(course_obj)
    
    return course_objects

def create_main_json_format(schedules):
    """Create the main.json format with actual group names"""
    main_format = {}
    
    for table_data in schedules:
        group_name = table_data.get('group_name')
        
        if not group_name:
            group_name = f"Group-{table_data['table_index']}"
        
        course_objects = create_course_objects(
            table_data['parsed_table'], 
            group_name
        )
        
        if course_objects:
            main_format[group_name] = course_objects
    
    return main_format


def build_lessons_by_location(main_format):
    """Build lessons grouped by location, skipping online lessons"""
    result = {}
    for group_lessons in main_format.values():
        for lesson in group_lessons:
            if not lesson.get('isOnline', False):
                location = lesson.get('location', 'TBD')
                if location not in result:
                    result[location] = []
                result[location].append(lesson)
    return result


def build_lessons_by_teacher(main_format):
    """Build lessons grouped by teacher, skipping if teacher contains learn.astanait.edu.kz"""
    result = {}
    for group_lessons in main_format.values():
        for lesson in group_lessons:
            teacher = lesson.get('teacher', '')
            if 'learn.astanait.edu.kz' not in teacher:
                if teacher not in result:
                    result[teacher] = []
                result[teacher].append(lesson)
    return result

parser = openparse.DocumentParser(
    table_args={
        "parsing_algorithm": "pymupdf",
        "table_output_format": "markdown"
    }
)


pdf_files = [f for f in os.listdir(input_folder) if f.endswith('.pdf')]
pdf_files.sort()

if len(pdf_files) == 0:
    print("❌ No PDF files found in input folder")
    exit(1)

print(f"📁 Found {len(pdf_files)} PDF file(s):")
for i, pdf_file in enumerate(pdf_files, 1):
    print(f"  {i}. {pdf_file}")

merged_pdf_path = os.path.join(output_folder, "merged_schedules.pdf")
print(f"\n🔗 Merging {len(pdf_files)} PDFs into single file...")

pdf_file_paths = [os.path.join(input_folder, pdf_file) for pdf_file in pdf_files]
if merge_pdfs_to_single_file(pdf_file_paths, merged_pdf_path):
    print(f"📄 Merged PDF created: {merged_pdf_path}")
else:
    print("❌ Failed to merge PDFs, continuing with individual processing")

all_schedules = []

for file in pdf_files:
    try:
        pdf_path = os.path.join(input_folder, file)
        full_pdf_text = extract_text_from_pdf(pdf_path)
        
        if full_pdf_text:
            group_names = []
            lines = full_pdf_text.split('\n')
            for line in lines:
                if 'Group' in line and re.search(r'[A-Z]{2,4}-\d{4}[A-Z]?', line):
                    group_match = re.search(r'Group\s+([A-Z0-9\-]+)', line)
                    if group_match:
                        group_names.append(group_match.group(1))
            
            print(f"📋 Total group names found: {len(group_names)}")
        
        parsed_file = parser.parse(pdf_path)
        
        table_data = []
        for node in parsed_file.nodes:
            if hasattr(node, 'table') and node.table:
                table_data.append({
                    'type': 'table',
                    'content': node.text,
                    'table_data': node.table
                })
            elif 'table' in node.text.lower() or '|' in node.text:
                table_data.append({
                    'type': 'table_like',
                    'content': node.text
                })
        
        if table_data:
            for i, table in enumerate(table_data):
                group_name = None
                if i < len(group_names):
                    group_name = group_names[i]
                
                parsed_table = parse_markdown_table(table['content'])
                
                if parsed_table:
                    table_result = {
                        'source_file': file,
                        'table_index': i + 1,
                        'table_type': table['type'],
                        'raw_content': table['content'],
                        'parsed_table': parsed_table,
                        'group_name': group_name
                    }
                    
                    all_schedules.append(table_result)
            
    except Exception as e:
        print(f"Error processing {file}: {str(e)}")
    

if all_schedules:
    lessons_by_groupname = create_main_json_format(all_schedules)
    output = {
        "lessonsByGroupname": lessons_by_groupname,
        "lessonsByLocation": build_lessons_by_location(lessons_by_groupname),
        "lessonsByTeacher": build_lessons_by_teacher(lessons_by_groupname),
    }
    output_file_main = os.path.join(output_folder, "main.json")
    with open(output_file_main, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"📁 Combined main format saved to: {output_file_main}")
